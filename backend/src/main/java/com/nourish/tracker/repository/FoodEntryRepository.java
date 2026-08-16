package com.nourish.tracker.repository;

import com.nourish.tracker.domain.FoodEntry;
import com.nourish.tracker.domain.MealType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface FoodEntryRepository extends JpaRepository<FoodEntry, UUID> {
    Page<FoodEntry> findByUserIdAndConsumedAtGreaterThanEqualAndConsumedAtLessThanOrderByConsumedAtDesc(
            UUID userId, Instant from, Instant toExclusive, Pageable pageable);

    Page<FoodEntry> findByUserIdAndMealTypeAndConsumedAtGreaterThanEqualAndConsumedAtLessThanOrderByConsumedAtDesc(
            UUID userId, MealType mealType, Instant from, Instant toExclusive, Pageable pageable);
}
