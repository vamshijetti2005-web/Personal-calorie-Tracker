package com.nourish.tracker.api.chat;

import java.util.List;

public record ChatResponse(
        String reply,
        List<String> toolsUsed
) {
}
