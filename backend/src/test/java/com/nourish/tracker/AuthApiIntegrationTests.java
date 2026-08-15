package com.nourish.tracker;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void requiresAuthenticationAndIsolatesEachUsersData() throws Exception {
        mockMvc.perform(get("/api/goals"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        Auth userOne = register("one@example.test", "User One");
        Auth userTwo = register("two@example.test", "User Two");

        String entryBody = mockMvc.perform(post("/api/entries")
                        .header("Authorization", "Bearer " + userOne.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mealType": "LUNCH",
                                  "foodName": "Private meal",
                                  "quantity": 1,
                                  "servingUnit": "plate",
                                  "calories": 500,
                                  "proteinGrams": 20,
                                  "carbsGrams": 70,
                                  "fatGrams": 15,
                                  "consumedAt": "2026-08-15T12:00:00Z"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String entryId = objectMapper.readTree(entryBody).get("id").asText();

        mockMvc.perform(get("/api/entries")
                        .header("Authorization", "Bearer " + userTwo.token())
                        .param("from", "2026-08-15")
                        .param("to", "2026-08-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagination.total").value(0));

        mockMvc.perform(get("/api/entries/{id}", entryId)
                        .header("Authorization", "Bearer " + userTwo.token()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ENTRY_NOT_FOUND"));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + userOne.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userOne.userId()))
                .andExpect(jsonPath("$.email").value("one@example.test"));
    }

    @Test
    void logsInWithHashedPasswordAndRejectsBadCredentials() throws Exception {
        register("login@example.test", "Login User");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "LOGIN@example.test",
                                  "password": "StrongPass123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "login@example.test",
                                  "password": "wrong-password"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    private Auth register(String email, String displayName) throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "StrongPass123!",
                                  "displayName": "%s"
                                }
                                """.formatted(email, displayName)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        return new Auth(
                json.get("token").asText(),
                json.path("user").get("id").asText()
        );
    }

    private record Auth(String token, String userId) {
    }
}
