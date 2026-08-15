package com.nourish.tracker.api.ai;

import com.nourish.tracker.service.ai.GeminiNutritionService;
import com.nourish.tracker.service.ai.ImageUploadValidator;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final ImageUploadValidator imageUploadValidator;
    private final GeminiNutritionService geminiNutritionService;

    public AiController(
            ImageUploadValidator imageUploadValidator,
            GeminiNutritionService geminiNutritionService
    ) {
        this.imageUploadValidator = imageUploadValidator;
        this.geminiNutritionService = geminiNutritionService;
    }

    @PostMapping(
            path = "/extract",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ExtractionResponse extract(@RequestPart("image") MultipartFile image) {
        return geminiNutritionService.extract(imageUploadValidator.validate(image));
    }
}
