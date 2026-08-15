package com.nourish.tracker.service.chat;

import com.nourish.tracker.api.entry.CreateEntryRequest;
import com.nourish.tracker.api.goal.CreateGoalRequest;
import com.nourish.tracker.domain.MealType;
import com.nourish.tracker.service.EntryService;
import com.nourish.tracker.service.GoalService;
import com.nourish.tracker.service.ReportService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Component
public class ChatToolExecutor {
    private final EntryService entryService;
    private final GoalService goalService;
    private final ReportService reportService;

    public ChatToolExecutor(
            EntryService entryService,
            GoalService goalService,
            ReportService reportService
    ) {
        this.entryService = entryService;
        this.goalService = goalService;
        this.reportService = reportService;
    }

    public Object execute(String name, JsonNode arguments) {
        return switch (name) {
            case "get_current_goal" -> goalService.current();
            case "create_goal" -> goalService.create(new CreateGoalRequest(
                    integer(arguments, "dailyCalorieTarget"),
                    decimal(arguments, "proteinGrams"),
                    decimal(arguments, "carbsGrams"),
                    decimal(arguments, "fatGrams"),
                    decimal(arguments, "weightGoalKg"),
                    optionalInstant(arguments, "effectiveFrom")
            ));
            case "log_meal" -> createMeal(arguments);
            case "list_entries" -> entryService.list(
                    LocalDate.parse(text(arguments, "from")),
                    LocalDate.parse(text(arguments, "to")),
                    optionalMealType(arguments, "mealType"),
                    Math.min(optionalInteger(arguments, "limit", 20), 20),
                    0
            );
            case "get_calorie_report" -> reportService.calories(
                    LocalDate.parse(text(arguments, "from")),
                    LocalDate.parse(text(arguments, "to")),
                    optionalText(arguments, "granularity", "day")
            );
            case "get_macro_report" -> reportService.macros(
                    LocalDate.parse(text(arguments, "from")),
                    LocalDate.parse(text(arguments, "to")),
                    optionalText(arguments, "granularity", "day")
            );
            case "get_micro_summary" -> reportService.micronutrients(
                    LocalDate.parse(text(arguments, "from")),
                    LocalDate.parse(text(arguments, "to"))
            );
            case "get_goal_vs_actual" -> reportService.goalVsActual(
                    LocalDate.parse(text(arguments, "from")),
                    LocalDate.parse(text(arguments, "to"))
            );
            default -> throw new IllegalArgumentException("Unknown tool: " + name);
        };
    }

    private Object createMeal(JsonNode arguments) {
        Instant consumedAt = optionalInstant(arguments, "consumedAt");
        return entryService.create(new CreateEntryRequest(
                MealType.valueOf(text(arguments, "mealType").toUpperCase()),
                text(arguments, "foodName"),
                decimal(arguments, "quantity"),
                text(arguments, "servingUnit"),
                decimal(arguments, "calories"),
                decimal(arguments, "proteinGrams"),
                decimal(arguments, "carbsGrams"),
                decimal(arguments, "fatGrams"),
                optionalDecimal(arguments, "vitaminCMg"),
                optionalDecimal(arguments, "calciumMg"),
                optionalDecimal(arguments, "ironMg"),
                optionalDecimal(arguments, "vitaminDIU"),
                optionalDecimal(arguments, "potassiumMg"),
                consumedAt == null ? Instant.now() : consumedAt
        ));
    }

    private String text(JsonNode arguments, String name) {
        JsonNode value = arguments.get(name);
        if (value == null || value.isNull() || value.asText().isBlank()) {
            throw new IllegalArgumentException(name + " is required");
        }
        return value.asText();
    }

    private String optionalText(JsonNode arguments, String name, String fallback) {
        JsonNode value = arguments.get(name);
        return value == null || value.isNull() || value.asText().isBlank()
                ? fallback
                : value.asText();
    }

    private BigDecimal decimal(JsonNode arguments, String name) {
        return new BigDecimal(text(arguments, name));
    }

    private BigDecimal optionalDecimal(JsonNode arguments, String name) {
        JsonNode value = arguments.get(name);
        return value == null || value.isNull()
                ? null
                : value.decimalValue();
    }

    private int integer(JsonNode arguments, String name) {
        return Integer.parseInt(text(arguments, name));
    }

    private int optionalInteger(JsonNode arguments, String name, int fallback) {
        JsonNode value = arguments.get(name);
        return value == null || value.isNull() ? fallback : value.asInt();
    }

    private Instant optionalInstant(JsonNode arguments, String name) {
        JsonNode value = arguments.get(name);
        return value == null || value.isNull() || value.asText().isBlank()
                ? null
                : Instant.parse(value.asText());
    }

    private MealType optionalMealType(JsonNode arguments, String name) {
        JsonNode value = arguments.get(name);
        return value == null || value.isNull() || value.asText().isBlank()
                ? null
                : MealType.valueOf(value.asText().toUpperCase());
    }
}
