package com.nourish.tracker;

import com.nourish.tracker.config.DemoAccountInitializer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChatToolLoopIntegrationTests {
    private static final AtomicInteger REQUEST_COUNT = new AtomicInteger();
    private static final HttpServer GEMINI = startGemini();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext applicationContext;

    @DynamicPropertySource
    static void geminiProperties(DynamicPropertyRegistry registry) {
        registry.add("app.ai.gemini.api-key", () -> "test-key");
        registry.add(
                "app.ai.gemini.base-url",
                () -> "http://localhost:" + GEMINI.getAddress().getPort()
        );
    }

    @BeforeEach
    void authenticateDemoUser() {
        REQUEST_COUNT.set(0);
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity())
                .defaultRequest(get("/").with(jwt().jwt(token ->
                        token.subject(DemoAccountInitializer.DEMO_USER_ID.toString()))))
                .build();
    }

    @AfterAll
    static void stopGemini() {
        GEMINI.stop(0);
    }

    @Test
    void executesAReportToolAndReturnsTheFinalModelAnswer() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages": [
                                    {
                                      "role": "user",
                                      "content": "How many calories did I eat today?"
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value(
                        "I checked today's calorie report."
                ))
                .andExpect(jsonPath("$.toolsUsed[0]").value(
                        "get_calorie_report"
                ));
    }

    private static HttpServer startGemini() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
            server.createContext("/interactions", exchange -> {
                int request = REQUEST_COUNT.incrementAndGet();
                String response = request == 1
                        ? """
                        {
                          "id": "interaction-1",
                          "status": "requires_action",
                          "steps": [{
                            "type": "function_call",
                            "id": "call-1",
                            "name": "get_calorie_report",
                            "arguments": {
                              "from": "2026-08-15",
                              "to": "2026-08-15",
                              "granularity": "day"
                            }
                          }]
                        }
                        """
                        : """
                        {
                          "id": "interaction-2",
                          "status": "completed",
                          "steps": [{
                            "type": "model_output",
                            "content": [{
                              "type": "text",
                              "text": "I checked today's calorie report."
                            }]
                          }]
                        }
                        """;
                respond(exchange, response);
            });
            server.start();
            return server;
        } catch (IOException exception) {
            throw new IllegalStateException("Could not start fake Gemini", exception);
        }
    }

    private static void respond(HttpExchange exchange, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
