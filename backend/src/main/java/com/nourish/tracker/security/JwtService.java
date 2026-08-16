package com.nourish.tracker.security;

import com.nourish.tracker.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class JwtService {
    private final JwtEncoder jwtEncoder;
    private final Duration expiration;

    public JwtService(
            JwtEncoder jwtEncoder,
            @Value("${app.jwt.expiration-hours:24}") long expirationHours
    ) {
        this.jwtEncoder = jwtEncoder;
        this.expiration = Duration.ofHours(expirationHours);
    }

    public IssuedToken issue(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("nourish-api")
                .issuedAt(now)
                .expiresAt(now.plus(expiration))
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getDisplayName())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String value = jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();
        return new IssuedToken(value, expiration.toSeconds());
    }

    public record IssuedToken(String value, long expiresInSeconds) {
    }
}
