package com.nourish.tracker.api.entry;

import com.nourish.tracker.domain.FoodEntry;
import com.nourish.tracker.domain.MealType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EntryResponse(
        UUID id,
        MealType mealType,
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
        Instant consumedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static EntryResponse from(FoodEntry entry) {
        return new EntryResponse(
                entry.getId(),
                entry.getMealType(),
                entry.getFoodName(),
                entry.getQuantity(),
                entry.getServingUnit(),
                entry.getCalories(),
                entry.getProteinGrams(),
                entry.getCarbsGrams(),
                entry.getFatGrams(),
                entry.getVitaminCMg(),
                entry.getCalciumMg(),
                entry.getIronMg(),
                entry.getVitaminDIU(),
                entry.getPotassiumMg(),
                entry.getConsumedAt(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
