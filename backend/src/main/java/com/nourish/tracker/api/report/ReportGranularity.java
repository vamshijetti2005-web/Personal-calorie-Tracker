package com.nourish.tracker.api.report;

import com.nourish.tracker.api.error.ApiException;
import org.springframework.http.HttpStatus;

import java.util.Locale;

public enum ReportGranularity {
    DAY,
    WEEK;

    public static ReportGranularity from(String value) {
        try {
            return ReportGranularity.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_GRANULARITY",
                    "granularity must be day or week"
            );
        }
    }

    public String jsonValue() {
        return name().toLowerCase(Locale.ROOT);
    }

    public String sqlUnit() {
        return jsonValue();
    }
}
