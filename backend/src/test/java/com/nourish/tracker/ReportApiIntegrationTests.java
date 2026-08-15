package com.nourish.tracker;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReportApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EntityManager entityManager;

    @Test
    void aggregatesCaloriesMacrosMicrosAndHistoricalGoals() throws Exception {
        createGoal(2300, "2026-08-10T00:00:00Z");
        createGoal(2100, "2026-08-12T00:00:00Z");

        createEntry(
                "Breakfast",
                500,
                20,
                70,
                15,
                30,
                "2026-08-10T08:00:00Z"
        );
        createEntry(
                "Dinner",
                700,
                40,
                60,
                30,
                60,
                "2026-08-12T19:00:00Z"
        );

        // ReportRepository uses JDBC directly, so flush pending JPA writes first.
        entityManager.flush();

        mockMvc.perform(get("/api/reports/calories")
                        .param("from", "2026-08-10")
                        .param("to", "2026-08-12")
                        .param("granularity", "day"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.granularity").value("day"))
                .andExpect(jsonPath("$.points.length()").value(3))
                .andExpect(jsonPath("$.points[0].calories").value(500))
                .andExpect(jsonPath("$.points[1].calories").value(0))
                .andExpect(jsonPath("$.points[2].calories").value(700));

        mockMvc.perform(get("/api/reports/calories")
                        .param("from", "2026-08-10")
                        .param("to", "2026-08-16")
                        .param("granularity", "week"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.granularity").value("week"))
                .andExpect(jsonPath("$.points.length()").value(1))
                .andExpect(jsonPath("$.points[0].calories").value(1200));

        mockMvc.perform(get("/api/reports/macros")
                        .param("from", "2026-08-10")
                        .param("to", "2026-08-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points[0].proteinGrams").value(20))
                .andExpect(jsonPath("$.points[2].proteinGrams").value(40))
                .andExpect(jsonPath("$.points[2].fatGrams").value(30));

        mockMvc.perform(get("/api/reports/micros")
                        .param("from", "2026-08-10")
                        .param("to", "2026-08-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dayCount").value(3))
                .andExpect(jsonPath("$.totals.vitaminCMg").value(90))
                .andExpect(jsonPath("$.dailyAverages.vitaminCMg").value(30))
                .andExpect(jsonPath("$.referenceDailyTargets.calciumMg").value(1000));

        mockMvc.perform(get("/api/reports/goal-vs-actual")
                        .param("from", "2026-08-10")
                        .param("to", "2026-08-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points[0].goal.calories").value(2300))
                .andExpect(jsonPath("$.points[1].goal.calories").value(2300))
                .andExpect(jsonPath("$.points[2].goal.calories").value(2100))
                .andExpect(jsonPath("$.points[2].actual.calories").value(700));
    }

    @Test
    void rejectsInvalidReportParameters() throws Exception {
        mockMvc.perform(get("/api/reports/calories")
                        .param("from", "2026-08-01")
                        .param("to", "2026-08-02")
                        .param("granularity", "month"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_GRANULARITY"));

        mockMvc.perform(get("/api/reports/macros")
                        .param("from", "2025-01-01")
                        .param("to", "2026-08-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("DATE_RANGE_TOO_LARGE"));
    }

    private void createGoal(int calories, String effectiveFrom) throws Exception {
        mockMvc.perform(post("/api/goals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dailyCalorieTarget": %d,
                                  "proteinGrams": 150,
                                  "carbsGrams": 220,
                                  "fatGrams": 70,
                                  "weightGoalKg": 70,
                                  "effectiveFrom": "%s"
                                }
                                """.formatted(calories, effectiveFrom)))
                .andExpect(status().isCreated());
    }

    private void createEntry(
            String foodName,
            int calories,
            int protein,
            int carbs,
            int fat,
            int vitaminC,
            String consumedAt
    ) throws Exception {
        mockMvc.perform(post("/api/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mealType": "DINNER",
                                  "foodName": "%s",
                                  "quantity": 1,
                                  "servingUnit": "serving",
                                  "calories": %d,
                                  "proteinGrams": %d,
                                  "carbsGrams": %d,
                                  "fatGrams": %d,
                                  "vitaminCMg": %d,
                                  "consumedAt": "%s"
                                }
                                """.formatted(
                                foodName,
                                calories,
                                protein,
                                carbs,
                                fat,
                                vitaminC,
                                consumedAt
                        )))
                .andExpect(status().isCreated());
    }
}
