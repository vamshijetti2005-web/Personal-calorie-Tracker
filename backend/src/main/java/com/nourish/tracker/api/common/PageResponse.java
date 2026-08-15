package com.nourish.tracker.api.common;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(
        List<T> data,
        Pagination pagination
) {
    public record Pagination(int limit, long offset, long total) {
    }

    public static <S, T> PageResponse<T> from(
            Page<S> page,
            int limit,
            long offset,
            Function<S, T> mapper
    ) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                new Pagination(limit, offset, page.getTotalElements())
        );
    }
}
