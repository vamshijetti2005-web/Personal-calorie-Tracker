package com.nourish.tracker.service;

import com.nourish.tracker.api.error.ApiException;
import com.nourish.tracker.domain.User;
import com.nourish.tracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DemoUserService {
    public static final UUID DEMO_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final UserRepository userRepository;

    public DemoUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User getDemoUser() {
        return userRepository.findById(DEMO_USER_ID)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "DEMO_USER_MISSING",
                        "Demo user is missing; verify Flyway migration V2"
                ));
    }
}
