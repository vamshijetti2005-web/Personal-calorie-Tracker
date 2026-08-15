package com.nourish.tracker;

import com.nourish.tracker.config.DemoAccountInitializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.ai.gemini.api-key=")
@AutoConfigureMockMvc
class AiExtractionApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext applicationContext;

    @BeforeEach
    void authenticateDemoUser() {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity())
                .defaultRequest(get("/").with(jwt().jwt(token ->
                        token.subject(DemoAccountInitializer.DEMO_USER_ID.toString()))))
                .build();
    }

    @Test
    void rejectsMissingOrDisguisedImages() throws Exception {
        mockMvc.perform(multipart("/api/ai/extract"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        MockMultipartFile disguisedText = new MockMultipartFile(
                "image",
                "food.png",
                "image/png",
                "this is not a png".getBytes()
        );

        mockMvc.perform(multipart("/api/ai/extract").file(disguisedText))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_IMAGE"));
    }

    @Test
    void rejectsImagesLargerThanFiveMegabytes() throws Exception {
        byte[] oversized = new byte[(5 * 1024 * 1024) + 1];
        oversized[0] = (byte) 0xFF;
        oversized[1] = (byte) 0xD8;
        oversized[2] = (byte) 0xFF;

        MockMultipartFile image = new MockMultipartFile(
                "image",
                "large.jpg",
                "image/jpeg",
                oversized
        );

        mockMvc.perform(multipart("/api/ai/extract").file(image))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("IMAGE_TOO_LARGE"));
    }

    @Test
    void returnsClearErrorWhenGeminiIsNotConfigured() throws Exception {
        MockMultipartFile validSignature = new MockMultipartFile(
                "image",
                "food.png",
                "image/png",
                new byte[]{
                        (byte) 0x89, 0x50, 0x4E, 0x47,
                        0x0D, 0x0A, 0x1A, 0x0A
                }
        );

        mockMvc.perform(multipart("/api/ai/extract").file(validSignature))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("AI_UNAVAILABLE"))
                .andExpect(jsonPath("$.message").value(
                        "Gemini is not configured. Set GEMINI_API_KEY and restart the backend."
                ));
    }
}
