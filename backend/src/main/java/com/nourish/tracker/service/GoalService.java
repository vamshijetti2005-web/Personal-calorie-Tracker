package com.nourish.tracker.service;

import com.nourish.tracker.api.common.PageResponse;
import com.nourish.tracker.api.error.ApiException;
import com.nourish.tracker.api.goal.CreateGoalRequest;
import com.nourish.tracker.api.goal.GoalResponse;
import com.nourish.tracker.domain.Goal;
import com.nourish.tracker.repository.GoalRepository;
import com.nourish.tracker.support.OffsetLimitPageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class GoalService {
    private final GoalRepository goalRepository;
    private final DemoUserService demoUserService;

    public GoalService(GoalRepository goalRepository, DemoUserService demoUserService) {
        this.goalRepository = goalRepository;
        this.demoUserService = demoUserService;
    }

    @Transactional
    public GoalResponse create(CreateGoalRequest request) {
        Goal goal = new Goal();
        goal.setUser(demoUserService.getDemoUser());
        goal.setDailyCalorieTarget(request.dailyCalorieTarget());
        goal.setProteinGrams(request.proteinGrams());
        goal.setCarbsGrams(request.carbsGrams());
        goal.setFatGrams(request.fatGrams());
        goal.setWeightGoalKg(request.weightGoalKg());
        goal.setEffectiveFrom(Optional.ofNullable(request.effectiveFrom()).orElseGet(Instant::now));

        return GoalResponse.from(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public PageResponse<GoalResponse> list(int limit, long offset) {
        var page = goalRepository.findByUserIdOrderByEffectiveFromDesc(
                DemoUserService.DEMO_USER_ID,
                new OffsetLimitPageable(offset, limit)
        );
        return PageResponse.from(page, limit, offset, GoalResponse::from);
    }

    @Transactional(readOnly = true)
    public GoalResponse current() {
        return GoalResponse.from(currentEntity().orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "GOAL_NOT_FOUND",
                "No effective goal exists yet"
        )));
    }

    @Transactional(readOnly = true)
    public GoalResponse get(UUID id) {
        return GoalResponse.from(findOwned(id));
    }

    @Transactional
    public void delete(UUID id) {
        Goal goal = findOwned(id);
        if (currentEntity().map(Goal::getId).filter(id::equals).isPresent()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "CURRENT_GOAL_DELETE_FORBIDDEN",
                    "Create a newer goal version before deleting the current one"
            );
        }
        goalRepository.delete(goal);
    }

    private Goal findOwned(UUID id) {
        return goalRepository.findById(id)
                .filter(goal -> DemoUserService.DEMO_USER_ID.equals(goal.getUser().getId()))
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "GOAL_NOT_FOUND",
                        "Goal was not found"
                ));
    }

    private Optional<Goal> currentEntity() {
        return goalRepository
                .findFirstByUserIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
                        DemoUserService.DEMO_USER_ID,
                        Instant.now()
                );
    }
}
