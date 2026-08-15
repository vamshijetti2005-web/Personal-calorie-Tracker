package com.nourish.tracker.api.entry;

import com.nourish.tracker.domain.MealType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record UpdateEntryRequest(
        MealType mealType,
        @Size(max = 160) @Pattern(regexp = ".*\\S.*", message = "must not be blank") String foodName,
        @DecimalMin(value = "0.0", inclusive = false) @DecimalMax("10000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal quantity,
        @Size(max = 40) @Pattern(regexp = ".*\\S.*", message = "must not be blank") String servingUnit,
        @DecimalMin("0.0") @DecimalMax("10000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal calories,
        @DecimalMin("0.0") @DecimalMax("1000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal proteinGrams,
        @DecimalMin("0.0") @DecimalMax("1000.0")
        @Digits(integer = 6, fraction = 2) BigDecimal carbsGrams,
        @DecimalMin("0.0") @DecimalMax("1000.0")
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
        Instant consumedAt
) {
}
