package com.nourish.tracker;

import com.nourish.tracker.config.DemoAccountInitializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CoreCrudApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private WebApplicationContext applicationContext;

    @BeforeEach
    void isolateDemoUserData() {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity())
                .defaultRequest(get("/").with(jwt().jwt(token ->
                        token.subject(DemoAccountInitializer.DEMO_USER_ID.toString()))))
                .build();
        jdbcTemplate.update(
                "DELETE FROM food_entries WHERE user_id = ?",
                DemoAccountInitializer.DEMO_USER_ID
        );
        jdbcTemplate.update(
                "DELETE FROM goals WHERE user_id = ?",
                DemoAccountInitializer.DEMO_USER_ID
        );
    }

    @Test
    void createsAndListsGoalVersionsWithPagination() throws Exception {
        String response = mockMvc.perform(post("/api/goals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dailyCalorieTarget": 2200,
                                  "proteinGrams": 145,
                                  "carbsGrams": 230,
                                  "fatGrams": 72,
                                  "weightGoalKg": 71,
                                  "effectiveFrom": "2026-08-10T14:30:00Z"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dailyCalorieTarget").value(2200))
                .andExpect(jsonPath("$.effectiveFrom").value("2026-08-10T00:00:00Z"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String id = objectMapper.readTree(response).get("id").asText();

        String futureResponse = mockMvc.perform(post("/api/goals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dailyCalorieTarget": 2000,
                                  "proteinGrams": 150,
                                  "carbsGrams": 200,
                                  "fatGrams": 65,
                                  "weightGoalKg": 69,
                                  "effectiveFrom": "2099-01-01T12:00:00Z"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String futureId = objectMapper.readTree(futureResponse).get("id").asText();

        mockMvc.perform(get("/api/goals/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));

        mockMvc.perform(get("/api/goals")
                        .param("limit", "1")
                        .param("offset", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.pagination.limit").value(1))
                .andExpect(jsonPath("$.pagination.offset").value(1));

        mockMvc.perform(get("/api/goals/current"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));

        mockMvc.perform(delete("/api/goals/{id}", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EFFECTIVE_GOAL_IMMUTABLE"));

        mockMvc.perform(delete("/api/goals/{id}", futureId))
                .andExpect(status().isNoContent());
    }

    @Test
    void createsUpdatesFiltersAndDeletesFoodEntry() throws Exception {
        String response = mockMvc.perform(post("/api/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mealType": "LUNCH",
                                  "foodName": "Rice and dal",
                                  "quantity": 1,
                                  "servingUnit": "plate",
                                  "calories": 520,
                                  "proteinGrams": 20,
                                  "carbsGrams": 82,
                                  "fatGrams": 12,
                                  "consumedAt": "2026-08-15T12:30:00Z"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.calciumMg").value(0))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode created = objectMapper.readTree(response);
        String id = created.get("id").asText();

        mockMvc.perform(patch("/api/entries/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"calories": 535, "foodName": "Rice, dal and vegetables"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calories").value(535))
                .andExpect(jsonPath("$.foodName").value("Rice, dal and vegetables"));

        mockMvc.perform(get("/api/entries")
                        .param("from", "2026-08-15")
                        .param("to", "2026-08-15")
                        .param("mealType", "LUNCH")
                        .param("limit", "20")
                        .param("offset", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].mealType").value("LUNCH"));

        mockMvc.perform(delete("/api/entries/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/entries/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ENTRY_NOT_FOUND"));
    }

    @Test
    void rejectsInvalidNutritionAndDateRanges() throws Exception {
        mockMvc.perform(post("/api/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mealType": "DINNER",
                                  "foodName": "Invalid meal",
                                  "quantity": 1,
                                  "servingUnit": "plate",
                                  "calories": -1,
                                  "proteinGrams": 0,
                                  "carbsGrams": 0,
                                  "fatGrams": 0,
                                  "consumedAt": "2026-08-15T19:00:00Z"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.calories").exists());

        mockMvc.perform(get("/api/entries")
                        .param("from", "2026-08-15")
                        .param("to", "2026-08-14"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_DATE_RANGE"));
    }
}
