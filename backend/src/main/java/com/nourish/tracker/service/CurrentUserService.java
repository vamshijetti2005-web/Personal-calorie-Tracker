package com.nourish.tracker.service;

import com.nourish.tracker.api.error.ApiException;
import com.nourish.tracker.domain.User;
import com.nourish.tracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UUID getCurrentUserId() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw unauthorized();
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw unauthorized();
        }
    }

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        return userRepository.findById(getCurrentUserId())
                .orElseThrow(this::unauthorized);
    }

    private ApiException unauthorized() {
        return new ApiException(
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                "The authenticated account no longer exists"
        );
    }
}
