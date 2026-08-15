package com.nourish.tracker.api.auth;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresInSeconds,
        UserResponse user
) {
}
