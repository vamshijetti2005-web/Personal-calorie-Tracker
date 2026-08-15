package com.nourish.tracker.config;

import com.nourish.tracker.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
public class DemoAccountInitializer implements ApplicationRunner {
    public static final UUID DEMO_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String UNINITIALIZED = "NOT_USED_IN_SINGLE_USER_MODE";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoAccountInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        userRepository.findById(DEMO_USER_ID)
                .filter(user -> UNINITIALIZED.equals(user.getPasswordHash()))
                .ifPresent(user -> {
                    user.setPasswordHash(passwordEncoder.encode("DemoPass123!"));
                    userRepository.save(user);
                });
    }
}
