package com.nourish.tracker.api.goal;

import com.nourish.tracker.api.common.PageResponse;
import com.nourish.tracker.service.GoalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/goals")
public class GoalController {
    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse create(@Valid @RequestBody CreateGoalRequest request) {
        return goalService.create(request);
    }

    @GetMapping
    public PageResponse<GoalResponse> list(
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "0") @Min(0) long offset
    ) {
        return goalService.list(limit, offset);
    }

    @GetMapping("/current")
    public GoalResponse current() {
        return goalService.current();
    }

    @GetMapping("/{id}")
    public GoalResponse get(@PathVariable UUID id) {
        return goalService.get(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        goalService.delete(id);
    }
}
