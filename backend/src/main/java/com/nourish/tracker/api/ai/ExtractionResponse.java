package com.nourish.tracker.api.ai;

public record ExtractionResponse(
        String status,
        NutritionExtraction extraction
) {
}
