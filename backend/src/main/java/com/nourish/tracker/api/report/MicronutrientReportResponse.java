package com.nourish.tracker.api.report;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MicronutrientReportResponse(
        LocalDate from,
        LocalDate to,
        long dayCount,
        Micronutrients totals,
        Micronutrients dailyAverages,
        Micronutrients referenceDailyTargets
) {
    public record Micronutrients(
            BigDecimal vitaminCMg,
            BigDecimal calciumMg,
            BigDecimal ironMg,
            BigDecimal vitaminDIU,
            BigDecimal potassiumMg
    ) {
    }
}
