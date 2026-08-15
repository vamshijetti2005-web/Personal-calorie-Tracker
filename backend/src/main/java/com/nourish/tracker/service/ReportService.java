package com.nourish.tracker.service;

import com.nourish.tracker.api.error.ApiException;
import com.nourish.tracker.api.report.CalorieReportResponse;
import com.nourish.tracker.api.report.GoalVsActualReportResponse;
import com.nourish.tracker.api.report.MacroReportResponse;
import com.nourish.tracker.api.report.MicronutrientReportResponse;
import com.nourish.tracker.api.report.MicronutrientReportResponse.Micronutrients;
import com.nourish.tracker.api.report.ReportGranularity;
import com.nourish.tracker.repository.ReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class ReportService {
    private static final long MAX_RANGE_DAYS = 366;
    private static final Micronutrients REFERENCE_DAILY_TARGETS = new Micronutrients(
            new BigDecimal("90"),
            new BigDecimal("1000"),
            new BigDecimal("18"),
            new BigDecimal("600"),
            new BigDecimal("3400")
    );

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Transactional(readOnly = true)
    public CalorieReportResponse calories(
            LocalDate from,
            LocalDate to,
            String granularityValue
    ) {
        validateRange(from, to);
        ReportGranularity granularity = ReportGranularity.from(granularityValue);
        return new CalorieReportResponse(
                granularity.jsonValue(),
                from,
                to,
                reportRepository.calorieTrend(
                        DemoUserService.DEMO_USER_ID,
                        from,
                        to,
                        granularity
                )
        );
    }

    @Transactional(readOnly = true)
    public MacroReportResponse macros(
            LocalDate from,
            LocalDate to,
            String granularityValue
    ) {
        validateRange(from, to);
        ReportGranularity granularity = ReportGranularity.from(granularityValue);
        return new MacroReportResponse(
                granularity.jsonValue(),
                from,
                to,
                reportRepository.macroTrend(
                        DemoUserService.DEMO_USER_ID,
                        from,
                        to,
                        granularity
                )
        );
    }

    @Transactional(readOnly = true)
    public MicronutrientReportResponse micronutrients(LocalDate from, LocalDate to) {
        long dayCount = validateRange(from, to);
        Micronutrients totals = reportRepository.micronutrientTotals(
                DemoUserService.DEMO_USER_ID,
                from,
                to
        );

        return new MicronutrientReportResponse(
                from,
                to,
                dayCount,
                totals,
                averages(totals, dayCount),
                REFERENCE_DAILY_TARGETS
        );
    }

    @Transactional(readOnly = true)
    public GoalVsActualReportResponse goalVsActual(LocalDate from, LocalDate to) {
        validateRange(from, to);
        return new GoalVsActualReportResponse(
                from,
                to,
                reportRepository.goalVsActual(DemoUserService.DEMO_USER_ID, from, to)
        );
    }

    private long validateRange(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_DATE_RANGE",
                    "to must be on or after from"
            );
        }

        long dayCount = ChronoUnit.DAYS.between(from, to) + 1;
        if (dayCount > MAX_RANGE_DAYS) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "DATE_RANGE_TOO_LARGE",
                    "Report date ranges cannot exceed 366 days"
            );
        }
        return dayCount;
    }

    private Micronutrients averages(Micronutrients totals, long dayCount) {
        BigDecimal divisor = BigDecimal.valueOf(dayCount);
        return new Micronutrients(
                average(totals.vitaminCMg(), divisor),
                average(totals.calciumMg(), divisor),
                average(totals.ironMg(), divisor),
                average(totals.vitaminDIU(), divisor),
                average(totals.potassiumMg(), divisor)
        );
    }

    private BigDecimal average(BigDecimal total, BigDecimal divisor) {
        return total.divide(divisor, 2, RoundingMode.HALF_UP);
    }
}
