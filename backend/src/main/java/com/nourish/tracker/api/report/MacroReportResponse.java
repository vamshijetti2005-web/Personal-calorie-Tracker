package com.nourish.tracker.api.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record MacroReportResponse(
        String granularity,
        LocalDate from,
        LocalDate to,
        List<MacroPoint> points
) {
    public record MacroPoint(
            LocalDate periodStart,
            BigDecimal proteinGrams,
            BigDecimal carbsGrams,
            BigDecimal fatGrams
    ) {
    }
}
