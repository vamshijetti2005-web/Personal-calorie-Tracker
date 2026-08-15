package com.nourish.tracker.support;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record OffsetLimitPageable(long offset, int pageSize, Sort sort) implements Pageable {

    public OffsetLimitPageable {
        if (offset < 0) {
            throw new IllegalArgumentException("offset must be non-negative");
        }
        if (pageSize < 1) {
            throw new IllegalArgumentException("limit must be positive");
        }
        sort = sort == null ? Sort.unsorted() : sort;
    }

    public OffsetLimitPageable(long offset, int pageSize) {
        this(offset, pageSize, Sort.unsorted());
    }

    @Override
    public int getPageNumber() {
        return Math.toIntExact(offset / pageSize);
    }

    @Override
    public int getPageSize() {
        return pageSize;
    }

    @Override
    public long getOffset() {
        return offset;
    }

    @Override
    public Sort getSort() {
        return sort;
    }

    @Override
    public Pageable next() {
        return new OffsetLimitPageable(offset + pageSize, pageSize, sort);
    }

    @Override
    public Pageable previousOrFirst() {
        return hasPrevious()
                ? new OffsetLimitPageable(Math.max(0, offset - pageSize), pageSize, sort)
                : first();
    }

    @Override
    public Pageable first() {
        return new OffsetLimitPageable(0, pageSize, sort);
    }

    @Override
    public Pageable withPage(int pageNumber) {
        if (pageNumber < 0) {
            throw new IllegalArgumentException("page number must be non-negative");
        }
        return new OffsetLimitPageable((long) pageNumber * pageSize, pageSize, sort);
    }

    @Override
    public boolean hasPrevious() {
        return offset > 0;
    }
}
