package com.nourish.tracker.api.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CalorieReportResponse(
        String granularity,
        LocalDate from,
        LocalDate to,
        List<CaloriePoint> points
) {
    public record CaloriePoint(LocalDate periodStart, BigDecimal calories) {
    }
}
