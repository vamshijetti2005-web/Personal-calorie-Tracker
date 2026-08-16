package com.nourish.tracker.api.ai;

import java.math.BigDecimal;
import java.util.List;

public record NutritionExtraction(
        String foodName,
        BigDecimal quantity,
        String servingUnit,
        BigDecimal calories,
        BigDecimal proteinGrams,
        BigDecimal carbsGrams,
        BigDecimal fatGrams,
        BigDecimal vitaminCMg,
        BigDecimal calciumMg,
        BigDecimal ironMg,
        BigDecimal vitaminDIU,
        BigDecimal potassiumMg,
        String confidence,
        String notes,
        List<String> warnings
) {
}
