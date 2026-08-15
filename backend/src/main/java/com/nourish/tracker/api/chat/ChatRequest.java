package com.nourish.tracker.api.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatRequest(
        @NotEmpty @Size(max = 20) List<@Valid ChatMessage> messages,
        @NotBlank String timeZone
) {
}
