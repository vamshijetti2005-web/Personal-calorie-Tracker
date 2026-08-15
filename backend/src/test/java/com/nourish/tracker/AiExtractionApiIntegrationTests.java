package com.nourish.tracker;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.ai.gemini.api-key=")
@AutoConfigureMockMvc
class AiExtractionApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

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
