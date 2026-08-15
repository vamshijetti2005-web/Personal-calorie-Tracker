package com.nourish.tracker.api.report;

import com.nourish.tracker.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/calories")
    public CalorieReportResponse calories(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "day") String granularity,
            @RequestParam(defaultValue = "UTC") String timeZone
    ) {
        return reportService.calories(from, to, granularity, timeZone);
    }

    @GetMapping("/macros")
    public MacroReportResponse macros(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "day") String granularity,
            @RequestParam(defaultValue = "UTC") String timeZone
    ) {
        return reportService.macros(from, to, granularity, timeZone);
    }

    @GetMapping("/micros")
    public MicronutrientReportResponse micronutrients(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "UTC") String timeZone
    ) {
        return reportService.micronutrients(from, to, timeZone);
    }

    @GetMapping("/goal-vs-actual")
    public GoalVsActualReportResponse goalVsActual(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "UTC") String timeZone
    ) {
        return reportService.goalVsActual(from, to, timeZone);
    }
}
