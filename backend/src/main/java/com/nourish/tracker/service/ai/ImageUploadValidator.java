package com.nourish.tracker.service.ai;

import com.nourish.tracker.api.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;

@Component
public class ImageUploadValidator {
    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "JPEG",
            "image/png", "PNG",
            "image/webp", "WebP"
    );

    public ValidatedImage validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalid("Upload a non-empty image in the 'image' field");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "IMAGE_TOO_LARGE",
                    "Image size cannot exceed 5 MB"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw invalid("Image must be JPEG, PNG, or WebP");
        }

        try {
            byte[] bytes = file.getBytes();
            if (!matchesSignature(contentType, bytes)) {
                throw invalid(
                        "File contents do not match the declared "
                                + EXTENSIONS.get(contentType)
                                + " image type"
                );
            }
            return new ValidatedImage(contentType, bytes);
        } catch (IOException exception) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "IMAGE_READ_ERROR",
                    "The uploaded image could not be read"
            );
        }
    }

    private boolean matchesSignature(String contentType, byte[] bytes) {
        return switch (contentType) {
            case "image/jpeg" -> startsWith(bytes, new byte[]{
                    (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
            });
            case "image/png" -> startsWith(bytes, new byte[]{
                    (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
            });
            case "image/webp" -> bytes.length >= 12
                    && startsWith(bytes, "RIFF".getBytes(StandardCharsets.US_ASCII))
                    && Arrays.equals(
                    Arrays.copyOfRange(bytes, 8, 12),
                    "WEBP".getBytes(StandardCharsets.US_ASCII)
            );
            default -> false;
        };
    }

    private boolean startsWith(byte[] bytes, byte[] signature) {
        return bytes.length >= signature.length
                && Arrays.equals(Arrays.copyOf(bytes, signature.length), signature);
    }

    private ApiException invalid(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_IMAGE", message);
    }

    public record ValidatedImage(String contentType, byte[] bytes) {
    }
}
