package com.nourish.tracker.service;

import com.nourish.tracker.api.common.PageResponse;
import com.nourish.tracker.api.entry.CreateEntryRequest;
import com.nourish.tracker.api.entry.EntryResponse;
import com.nourish.tracker.api.entry.UpdateEntryRequest;
import com.nourish.tracker.api.error.ApiException;
import com.nourish.tracker.domain.FoodEntry;
import com.nourish.tracker.domain.MealType;
import com.nourish.tracker.repository.FoodEntryRepository;
import com.nourish.tracker.support.OffsetLimitPageable;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
public class EntryService {
    private final FoodEntryRepository entryRepository;
    private final DemoUserService demoUserService;

    public EntryService(
            FoodEntryRepository entryRepository,
            DemoUserService demoUserService
    ) {
        this.entryRepository = entryRepository;
        this.demoUserService = demoUserService;
    }

    @Transactional
    public EntryResponse create(CreateEntryRequest request) {
        FoodEntry entry = new FoodEntry();
        entry.setUser(demoUserService.getDemoUser());
        applyCreateRequest(entry, request);
        return EntryResponse.from(entryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public PageResponse<EntryResponse> list(
            LocalDate from,
            LocalDate to,
            MealType mealType,
            int limit,
            long offset
    ) {
        if (to.isBefore(from)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_DATE_RANGE",
                    "to must be on or after from"
            );
        }

        Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toExclusive = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        var pageable = new OffsetLimitPageable(offset, limit);

        Page<FoodEntry> page = mealType == null
                ? entryRepository
                .findByUserIdAndConsumedAtGreaterThanEqualAndConsumedAtLessThanOrderByConsumedAtDesc(
                        DemoUserService.DEMO_USER_ID,
                        fromInstant,
                        toExclusive,
                        pageable
                )
                : entryRepository
                .findByUserIdAndMealTypeAndConsumedAtGreaterThanEqualAndConsumedAtLessThanOrderByConsumedAtDesc(
                        DemoUserService.DEMO_USER_ID,
                        mealType,
                        fromInstant,
                        toExclusive,
                        pageable
                );

        return PageResponse.from(page, limit, offset, EntryResponse::from);
    }

    @Transactional(readOnly = true)
    public EntryResponse get(UUID id) {
        return EntryResponse.from(findOwned(id));
    }

    @Transactional
    public EntryResponse update(UUID id, UpdateEntryRequest request) {
        FoodEntry entry = findOwned(id);

        if (request.mealType() != null) entry.setMealType(request.mealType());
        if (request.foodName() != null) entry.setFoodName(request.foodName().trim());
        if (request.quantity() != null) entry.setQuantity(request.quantity());
        if (request.servingUnit() != null) entry.setServingUnit(request.servingUnit().trim());
        if (request.calories() != null) entry.setCalories(request.calories());
        if (request.proteinGrams() != null) entry.setProteinGrams(request.proteinGrams());
        if (request.carbsGrams() != null) entry.setCarbsGrams(request.carbsGrams());
        if (request.fatGrams() != null) entry.setFatGrams(request.fatGrams());
        if (request.vitaminCMg() != null) entry.setVitaminCMg(request.vitaminCMg());
        if (request.calciumMg() != null) entry.setCalciumMg(request.calciumMg());
        if (request.ironMg() != null) entry.setIronMg(request.ironMg());
        if (request.vitaminDIU() != null) entry.setVitaminDIU(request.vitaminDIU());
        if (request.potassiumMg() != null) entry.setPotassiumMg(request.potassiumMg());
        if (request.consumedAt() != null) entry.setConsumedAt(request.consumedAt());

        return EntryResponse.from(entryRepository.save(entry));
    }

    @Transactional
    public void delete(UUID id) {
        entryRepository.delete(findOwned(id));
    }

    private void applyCreateRequest(FoodEntry entry, CreateEntryRequest request) {
        entry.setMealType(request.mealType());
        entry.setFoodName(request.foodName().trim());
        entry.setQuantity(request.quantity());
        entry.setServingUnit(request.servingUnit().trim());
        entry.setCalories(request.calories());
        entry.setProteinGrams(request.proteinGrams());
        entry.setCarbsGrams(request.carbsGrams());
        entry.setFatGrams(request.fatGrams());
        entry.setVitaminCMg(orZero(request.vitaminCMg()));
        entry.setCalciumMg(orZero(request.calciumMg()));
        entry.setIronMg(orZero(request.ironMg()));
        entry.setVitaminDIU(orZero(request.vitaminDIU()));
        entry.setPotassiumMg(orZero(request.potassiumMg()));
        entry.setConsumedAt(request.consumedAt());
    }

    private FoodEntry findOwned(UUID id) {
        return entryRepository.findById(id)
                .filter(entry -> DemoUserService.DEMO_USER_ID.equals(entry.getUser().getId()))
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ENTRY_NOT_FOUND",
                        "Food entry was not found"
                ));
    }

    private BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
