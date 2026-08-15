package com.nourish.tracker.api.goal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateGoalRequest(
        @NotNull @Min(500) @Max(10_000)
        Integer dailyCalorieTarget,

        @NotNull @DecimalMin("0.0") @DecimalMax("1000.0") @Digits(integer = 6, fraction = 2)
        BigDecimal proteinGrams,

        @NotNull @DecimalMin("0.0") @DecimalMax("1000.0") @Digits(integer = 6, fraction = 2)
        BigDecimal carbsGrams,

        @NotNull @DecimalMin("0.0") @DecimalMax("1000.0") @Digits(integer = 6, fraction = 2)
        BigDecimal fatGrams,

        @NotNull @DecimalMin("20.0") @DecimalMax("400.0") @Digits(integer = 4, fraction = 2)
        BigDecimal weightGoalKg,

        Instant effectiveFrom
) {
}
