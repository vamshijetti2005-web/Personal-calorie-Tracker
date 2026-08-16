package com.nourish.tracker.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public final class RenderDatabaseEnvironment {
    private RenderDatabaseEnvironment() {
    }

    public static void configure() {
        String connection = System.getenv("RENDER_DATABASE_URL");
        if (connection == null || connection.isBlank()) return;

        DatabaseSettings settings = parse(connection);
        System.setProperty("spring.datasource.url", settings.jdbcUrl());
        System.setProperty("spring.datasource.username", settings.username());
        System.setProperty("spring.datasource.password", settings.password());
    }

    static DatabaseSettings parse(String connection) {
        URI uri = URI.create(connection);
        String userInfo = uri.getRawUserInfo();
        if (userInfo == null || uri.getHost() == null) {
            throw new IllegalStateException("Invalid Render database URL");
        }
        String[] credentials = userInfo.split(":", 2);
        if (credentials.length != 2) {
            throw new IllegalStateException("Invalid Render database credentials");
        }

        String username = decode(credentials[0]);
        String password = decode(credentials[1]);
        String database = decode(uri.getRawPath().replaceFirst("^/", ""));
        int port = uri.getPort() < 0 ? 5432 : uri.getPort();
        String jdbcUrl = "jdbc:postgresql://%s:%d/%s".formatted(
                uri.getHost(),
                port,
                database
        );

        return new DatabaseSettings(jdbcUrl, username, password);
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    record DatabaseSettings(String jdbcUrl, String username, String password) {
    }
}
