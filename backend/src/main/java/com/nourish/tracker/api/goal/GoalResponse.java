package com.nourish.tracker.api.goal;

import com.nourish.tracker.domain.Goal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        int dailyCalorieTarget,
        BigDecimal proteinGrams,
        BigDecimal carbsGrams,
        BigDecimal fatGrams,
        BigDecimal weightGoalKg,
        Instant effectiveFrom,
        Instant createdAt
) {
    public static GoalResponse from(Goal goal) {
        return new GoalResponse(
                goal.getId(),
                goal.getDailyCalorieTarget(),
                goal.getProteinGrams(),
                goal.getCarbsGrams(),
                goal.getFatGrams(),
                goal.getWeightGoalKg(),
                goal.getEffectiveFrom(),
                goal.getCreatedAt()
        );
    }
}
