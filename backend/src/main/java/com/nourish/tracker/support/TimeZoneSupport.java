package com.nourish.tracker.support;

import com.nourish.tracker.api.error.ApiException;
import org.springframework.http.HttpStatus;

import java.time.DateTimeException;
import java.time.ZoneId;

public final class TimeZoneSupport {
    private TimeZoneSupport() {
    }

    public static ZoneId parse(String value) {
        try {
            return ZoneId.of(value);
        } catch (DateTimeException exception) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TIME_ZONE",
                    "timeZone must be a valid IANA timezone such as Asia/Kolkata"
            );
        }
    }
}
