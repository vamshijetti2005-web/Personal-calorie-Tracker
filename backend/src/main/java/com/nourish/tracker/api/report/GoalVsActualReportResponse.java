package com.nourish.tracker.api.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GoalVsActualReportResponse(
        LocalDate from,
        LocalDate to,
        List<GoalVsActualPoint> points
) {
    public record GoalVsActualPoint(
            LocalDate date,
            NutritionValues actual,
            NutritionValues goal
    ) {
    }

    public record NutritionValues(
            BigDecimal calories,
            BigDecimal proteinGrams,
            BigDecimal carbsGrams,
            BigDecimal fatGrams
    ) {
    }
}
