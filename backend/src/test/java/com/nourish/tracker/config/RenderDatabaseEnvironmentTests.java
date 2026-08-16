package com.nourish.tracker.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RenderDatabaseEnvironmentTests {

    @Test
    void convertsRenderConnectionStringToSpringDatasourceSettings() {
        var settings = RenderDatabaseEnvironment.parse(
                "postgresql://nourish:p%40ssword@db.internal:5432/nourish"
        );

        assertEquals(
                "jdbc:postgresql://db.internal:5432/nourish",
                settings.jdbcUrl()
        );
        assertEquals("nourish", settings.username());
        assertEquals("p@ssword", settings.password());
    }
}
