package com.nourish.tracker.repository;

import com.nourish.tracker.domain.Goal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {
    Page<Goal> findByUserIdOrderByEffectiveFromDesc(UUID userId, Pageable pageable);

    Optional<Goal> findFirstByUserIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
            UUID userId, Instant asOf);
}
