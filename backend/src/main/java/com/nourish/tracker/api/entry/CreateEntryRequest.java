package com.nourish.tracker.api.entry;

import com.nourish.tracker.domain.MealType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateEntryRequest(
        @NotNull MealType mealType,
        @NotBlank @Size(max = 160) String foodName,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) @DecimalMax("10000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal quantity,
        @NotBlank @Size(max = 40) String servingUnit,
        @NotNull @DecimalMin("0.0") @DecimalMax("10000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal calories,
        @NotNull @DecimalMin("0.0") @DecimalMax("1000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal proteinGrams,
        @NotNull @DecimalMin("0.0") @DecimalMax("1000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal carbsGrams,
        @NotNull @DecimalMin("0.0") @DecimalMax("1000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal fatGrams,
        @DecimalMin("0.0") @DecimalMax("10000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal vitaminCMg,
        @DecimalMin("0.0") @DecimalMax("10000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal calciumMg,
        @DecimalMin("0.0") @DecimalMax("1000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal ironMg,
        @DecimalMin("0.0") @DecimalMax("10000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal vitaminDIU,
        @DecimalMin("0.0") @DecimalMax("20000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal potassiumMg,
        @NotNull Instant consumedAt
) {
}
