package com.nourish.tracker.service.ai;

import com.nourish.tracker.api.ai.ExtractionResponse;
import com.nourish.tracker.api.ai.NutritionExtraction;
import com.nourish.tracker.api.error.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiNutritionService {
    private static final Logger LOGGER =
            LoggerFactory.getLogger(GeminiNutritionService.class);
    private static final String PROMPT = """
            Analyze this image as either a packaged-food nutrition label or a plate
            of food. Extract nutrition for the visible serving.

            Rules:
            - For a label, use printed values. Do not guess values hidden from view.
            - For a plate, make a conservative visual estimate and explain it.
            - Use null when a value cannot be read or reasonably estimated.
            - All numeric values must be non-negative.
            - Set confidence to low when the image is blurry, not food-related, or
              the calories and most macros cannot be determined.
            - List ambiguity, estimation, and missing important fields in warnings.
            - Micronutrients use mg except vitamin D, which uses IU.
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiNutritionService(
            ObjectMapper objectMapper,
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-3.5-flash}") String model,
            @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
            String baseUrl
    ) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
    }

    public ExtractionResponse extract(ImageUploadValidator.ValidatedImage image) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI_UNAVAILABLE",
                    "Gemini is not configured. Set GEMINI_API_KEY and restart the backend."
            );
        }

        Map<String, Object> request = Map.of(
                "model", model,
                "store", false,
                "input", List.of(
                        Map.of("type", "text", "text", PROMPT),
                        Map.of(
                                "type", "image",
                                "data", Base64.getEncoder().encodeToString(image.bytes()),
                                "mime_type", image.contentType()
                        )
                ),
                "response_format", Map.of(
                        "type", "text",
                        "mime_type", "application/json",
                        "schema", responseSchema()
                )
        );

        try {
            String providerResponse = restClient.post()
                    .uri(baseUrl + "/interactions")
                    .header("x-goog-api-key", apiKey)
                    .header("Api-Revision", "2026-05-20")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(String.class);

            NutritionExtraction extraction = parseExtraction(providerResponse);
            return new ExtractionResponse(status(extraction), extraction);
        } catch (RestClientResponseException exception) {
            LOGGER.warn(
                    "Gemini request failed with status {}",
                    exception.getStatusCode().value()
            );
            if (exception.getStatusCode().value() == 429) {
                throw new ApiException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "AI_RATE_LIMITED",
                        "Gemini's request limit was reached. Please try again shortly."
                );
            }
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "AI_PROVIDER_ERROR",
                    "Gemini could not analyze the image"
            );
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            LOGGER.error("Could not parse Gemini response", exception);
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "AI_PARSE_ERROR",
                    "Gemini returned an unreadable nutrition result"
            );
        }
    }

    private NutritionExtraction parseExtraction(String providerResponse) throws Exception {
        if (providerResponse == null || providerResponse.isBlank()) {
            throw new IllegalArgumentException("Gemini response was empty");
        }

        JsonNode root = objectMapper.readTree(providerResponse);
        String outputText = null;
        for (JsonNode step : root.path("steps")) {
            if (!"model_output".equals(step.path("type").asText())) continue;
            for (JsonNode content : step.path("content")) {
                if ("text".equals(content.path("type").asText())) {
                    outputText = content.path("text").asText();
                }
            }
        }
        if (outputText == null || outputText.isBlank()) {
            throw new IllegalArgumentException("Gemini response had no output text");
        }

        NutritionExtraction raw =
                objectMapper.readValue(outputText, NutritionExtraction.class);
        return normalize(raw);
    }

    private NutritionExtraction normalize(NutritionExtraction raw) {
        List<String> warnings = new ArrayList<>(
                raw.warnings() == null ? List.of() : raw.warnings()
        );
        String confidence = switch (
                raw.confidence() == null ? "" : raw.confidence().toLowerCase()
        ) {
            case "high" -> "high";
            case "medium" -> "medium";
            default -> "low";
        };

        NutritionExtraction normalized = new NutritionExtraction(
                blankToNull(raw.foodName()),
                nonNegative(raw.quantity(), "quantity", warnings),
                blankToNull(raw.servingUnit()),
                nonNegative(raw.calories(), "calories", warnings),
                nonNegative(raw.proteinGrams(), "protein", warnings),
                nonNegative(raw.carbsGrams(), "carbohydrates", warnings),
                nonNegative(raw.fatGrams(), "fat", warnings),
                nonNegative(raw.vitaminCMg(), "vitamin C", warnings),
                nonNegative(raw.calciumMg(), "calcium", warnings),
                nonNegative(raw.ironMg(), "iron", warnings),
                nonNegative(raw.vitaminDIU(), "vitamin D", warnings),
                nonNegative(raw.potassiumMg(), "potassium", warnings),
                confidence,
                raw.notes() == null ? "" : raw.notes().trim(),
                List.copyOf(warnings)
        );

        if (missingCoreNutrition(normalized)
                && warnings.stream().noneMatch(value ->
                value.toLowerCase().contains("nutrition"))) {
            warnings.add("Core nutrition values could not be determined.");
            return new NutritionExtraction(
                    normalized.foodName(),
                    normalized.quantity(),
                    normalized.servingUnit(),
                    normalized.calories(),
                    normalized.proteinGrams(),
                    normalized.carbsGrams(),
                    normalized.fatGrams(),
                    normalized.vitaminCMg(),
                    normalized.calciumMg(),
                    normalized.ironMg(),
                    normalized.vitaminDIU(),
                    normalized.potassiumMg(),
                    normalized.confidence(),
                    normalized.notes(),
                    List.copyOf(warnings)
            );
        }
        return normalized;
    }

    private String status(NutritionExtraction extraction) {
        if (missingCoreNutrition(extraction)) return "failed";
        if ("low".equals(extraction.confidence())
                || extraction.calories() == null
                || extraction.proteinGrams() == null
                || extraction.carbsGrams() == null
                || extraction.fatGrams() == null) {
            return "partial";
        }
        return "ok";
    }

    private boolean missingCoreNutrition(NutritionExtraction extraction) {
        return extraction.calories() == null
                && extraction.proteinGrams() == null
                && extraction.carbsGrams() == null
                && extraction.fatGrams() == null;
    }

    private BigDecimal nonNegative(
            BigDecimal value,
            String name,
            List<String> warnings
    ) {
        if (value == null) return null;
        if (value.signum() >= 0) return value;
        warnings.add("Ignored a negative " + name + " value returned by the model.");
        return null;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Map<String, Object> responseSchema() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("foodName", nullableString("Short food or dish name."));
        properties.put("quantity", nullableNumber("Numeric serving quantity."));
        properties.put("servingUnit", nullableString("g, ml, cup, plate, or serving."));
        properties.put("calories", nullableNumber("Calories for the visible serving."));
        properties.put("proteinGrams", nullableNumber("Protein grams."));
        properties.put("carbsGrams", nullableNumber("Carbohydrate grams."));
        properties.put("fatGrams", nullableNumber("Fat grams."));
        properties.put("vitaminCMg", nullableNumber("Vitamin C in mg."));
        properties.put("calciumMg", nullableNumber("Calcium in mg."));
        properties.put("ironMg", nullableNumber("Iron in mg."));
        properties.put("vitaminDIU", nullableNumber("Vitamin D in IU."));
        properties.put("potassiumMg", nullableNumber("Potassium in mg."));
        properties.put("confidence", Map.of(
                "type", "string",
                "enum", List.of("high", "medium", "low")
        ));
        properties.put("notes", Map.of(
                "type", "string",
                "description", "Brief source or estimation explanation."
        ));
        properties.put("warnings", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));

        return Map.of(
                "type", "object",
                "properties", properties,
                "required", List.copyOf(properties.keySet()),
                "additionalProperties", false
        );
    }

    private Map<String, Object> nullableString(String description) {
        return Map.of(
                "type", List.of("string", "null"),
                "description", description
        );
    }

    private Map<String, Object> nullableNumber(String description) {
        return Map.of(
                "type", List.of("number", "null"),
                "minimum", 0,
                "description", description
        );
    }
}
