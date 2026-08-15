package com.nourish.tracker.service.chat;

import com.nourish.tracker.api.chat.ChatMessage;
import com.nourish.tracker.api.chat.ChatRequest;
import com.nourish.tracker.api.chat.ChatResponse;
import com.nourish.tracker.api.error.ApiException;
import com.nourish.tracker.support.TimeZoneSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class GeminiChatService {
    private static final Logger LOGGER = LoggerFactory.getLogger(GeminiChatService.class);
    private static final int MAX_TOOL_ROUNDS = 5;

    private final ChatToolExecutor toolExecutor;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiChatService(
            ChatToolExecutor toolExecutor,
            ObjectMapper objectMapper,
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-3.5-flash}") String model,
            @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
            String baseUrl
    ) {
        this.toolExecutor = toolExecutor;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(45));
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public ChatResponse chat(ChatRequest request) {
        requireConfigured();
        ZoneId timeZone = TimeZoneSupport.parse(request.timeZone());

        Object input = conversationPrompt(request.messages(), timeZone);
        String previousInteractionId = null;
        Set<String> toolsUsed = new LinkedHashSet<>();

        for (int round = 0; round < MAX_TOOL_ROUNDS; round++) {
            JsonNode interaction = createInteraction(input, previousInteractionId);
            List<Map<String, Object>> functionResults = new ArrayList<>();

            for (JsonNode step : interaction.path("steps")) {
                if (!"function_call".equals(step.path("type").asText())) continue;
                String name = step.path("name").asText();
                String callId = step.path("id").asText();
                JsonNode arguments = step.path("arguments");
                toolsUsed.add(name);

                Object result;
                try {
                    result = toolExecutor.execute(name, arguments, timeZone.getId());
                } catch (Exception exception) {
                    result = Map.of("error", safeToolError(exception));
                }

                try {
                    functionResults.add(Map.of(
                            "type", "function_result",
                            "name", name,
                            "call_id", callId,
                            "result", List.of(Map.of(
                                    "type", "text",
                                    "text", objectMapper.writeValueAsString(result)
                            ))
                    ));
                } catch (Exception exception) {
                    throw parseError(exception);
                }
            }

            if (functionResults.isEmpty()) {
                String reply = outputText(interaction);
                if (reply == null || reply.isBlank()) {
                    throw parseError(new IllegalStateException("No model output"));
                }
                return new ChatResponse(reply.trim(), List.copyOf(toolsUsed));
            }

            previousInteractionId = interaction.path("id").asText();
            if (previousInteractionId.isBlank()) {
                throw parseError(new IllegalStateException("No interaction id"));
            }
            input = functionResults;
        }

        throw new ApiException(
                HttpStatus.BAD_GATEWAY,
                "AI_TOOL_LIMIT",
                "The assistant used too many consecutive tools. Please simplify the request."
        );
    }

    private JsonNode createInteraction(Object input, String previousInteractionId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("input", input);
        body.put("tools", tools());
        if (previousInteractionId != null) {
            body.put("previous_interaction_id", previousInteractionId);
        }

        try {
            String response = restClient.post()
                    .uri(baseUrl + "/interactions")
                    .header("x-goog-api-key", apiKey)
                    .header("Api-Revision", "2026-05-20")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            if (response == null || response.isBlank()) {
                throw new IllegalStateException("Empty Gemini response");
            }
            return objectMapper.readTree(response);
        } catch (RestClientResponseException exception) {
            LOGGER.warn("Gemini chat failed with status {}", exception.getStatusCode());
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
                    "Gemini could not complete the conversation"
            );
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw parseError(exception);
        }
    }

    private String conversationPrompt(
            List<ChatMessage> messages,
            ZoneId timeZone
    ) {
        StringBuilder prompt = new StringBuilder("""
                You are Nourish, the user's personal nutrition assistant.
                Use the supplied functions whenever the user asks about their saved
                meals, goals, or reports, or asks you to change data. Never invent
                saved data. Before logging a meal or creating a goal, ask for any
                missing required values rather than guessing them. Confirm successful
                writes clearly. Give concise, practical nutrition information, not
                medical diagnosis. Interpret dates in timezone %s. Current local
                date in that timezone: %s.

                Conversation:
                """.formatted(timeZone.getId(), LocalDate.now(timeZone)));
        for (ChatMessage message : messages) {
            prompt.append(message.role().toUpperCase())
                    .append(": ")
                    .append(message.content())
                    .append('\n');
        }
        prompt.append("ASSISTANT:");
        return prompt.toString();
    }

    private String outputText(JsonNode interaction) {
        String output = null;
        for (JsonNode step : interaction.path("steps")) {
            if (!"model_output".equals(step.path("type").asText())) continue;
            for (JsonNode content : step.path("content")) {
                if ("text".equals(content.path("type").asText())) {
                    output = content.path("text").asText();
                }
            }
        }
        return output;
    }

    private String safeToolError(Exception exception) {
        if (exception instanceof ApiException || exception instanceof IllegalArgumentException) {
            return exception.getMessage();
        }
        LOGGER.error("Chat tool execution failed", exception);
        return "The requested action could not be completed.";
    }

    private void requireConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI_UNAVAILABLE",
                    "Gemini is not configured. Set GEMINI_API_KEY and restart the backend."
            );
        }
    }

    private ApiException parseError(Exception exception) {
        LOGGER.error("Could not process Gemini chat response", exception);
        return new ApiException(
                HttpStatus.BAD_GATEWAY,
                "AI_PARSE_ERROR",
                "Gemini returned an unreadable chat response"
        );
    }

    private List<Map<String, Object>> tools() {
        return List.of(
                tool("get_current_goal", "Get the user's current nutrition goal.",
                        Map.of(), List.of()),
                tool("create_goal", "Create a new daily goal version.",
                        goalProperties(),
                        List.of("dailyCalorieTarget", "proteinGrams", "carbsGrams",
                                "fatGrams", "weightGoalKg")),
                tool("log_meal", "Create a meal entry after all required values are known.",
                        mealProperties(),
                        List.of("mealType", "foodName", "quantity", "servingUnit",
                                "calories", "proteinGrams", "carbsGrams", "fatGrams")),
                tool("list_entries", "List meals in an inclusive UTC date range.",
                        rangeProperties(true), List.of("from", "to")),
                tool("get_calorie_report", "Get calorie totals by day or week.",
                        reportProperties(), List.of("from", "to")),
                tool("get_macro_report", "Get macro totals by day or week.",
                        reportProperties(), List.of("from", "to")),
                tool("get_micro_summary", "Get micronutrient totals and daily averages.",
                        rangeProperties(false), List.of("from", "to")),
                tool("get_goal_vs_actual", "Compare actual intake with historical goals.",
                        rangeProperties(false), List.of("from", "to"))
        );
    }

    private Map<String, Object> tool(
            String name,
            String description,
            Map<String, Object> properties,
            List<String> required
    ) {
        return Map.of(
                "type", "function",
                "name", name,
                "description", description,
                "parameters", Map.of(
                        "type", "object",
                        "properties", properties,
                        "required", required
                )
        );
    }

    private Map<String, Object> goalProperties() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("dailyCalorieTarget", number("Daily calories."));
        properties.put("proteinGrams", number("Protein grams."));
        properties.put("carbsGrams", number("Carbohydrate grams."));
        properties.put("fatGrams", number("Fat grams."));
        properties.put("weightGoalKg", number("Weight goal in kilograms."));
        properties.put("effectiveFrom", string("Optional ISO-8601 UTC datetime."));
        return properties;
    }

    private Map<String, Object> mealProperties() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("mealType", Map.of(
                "type", "string",
                "enum", List.of("BREAKFAST", "LUNCH", "DINNER", "SNACKS")
        ));
        properties.put("foodName", string("Food or dish name."));
        properties.put("quantity", number("Positive serving quantity."));
        properties.put("servingUnit", string("Serving unit."));
        properties.put("calories", number("Calories."));
        properties.put("proteinGrams", number("Protein grams."));
        properties.put("carbsGrams", number("Carbohydrate grams."));
        properties.put("fatGrams", number("Fat grams."));
        properties.put("vitaminCMg", number("Optional vitamin C mg."));
        properties.put("calciumMg", number("Optional calcium mg."));
        properties.put("ironMg", number("Optional iron mg."));
        properties.put("vitaminDIU", number("Optional vitamin D IU."));
        properties.put("potassiumMg", number("Optional potassium mg."));
        properties.put("consumedAt", string("Optional ISO-8601 UTC datetime."));
        return properties;
    }

    private Map<String, Object> rangeProperties(boolean includeMealType) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("from", string("Start date YYYY-MM-DD."));
        properties.put("to", string("End date YYYY-MM-DD."));
        if (includeMealType) {
            properties.put("mealType", Map.of(
                    "type", "string",
                    "enum", List.of("BREAKFAST", "LUNCH", "DINNER", "SNACKS")
            ));
            properties.put("limit", Map.of(
                    "type", "integer",
                    "minimum", 1,
                    "maximum", 20
            ));
        }
        return properties;
    }

    private Map<String, Object> reportProperties() {
        Map<String, Object> properties = new LinkedHashMap<>(rangeProperties(false));
        properties.put("granularity", Map.of(
                "type", "string",
                "enum", List.of("day", "week")
        ));
        return properties;
    }

    private Map<String, Object> number(String description) {
        return Map.of("type", "number", "minimum", 0, "description", description);
    }

    private Map<String, Object> string(String description) {
        return Map.of("type", "string", "description", description);
    }
}
