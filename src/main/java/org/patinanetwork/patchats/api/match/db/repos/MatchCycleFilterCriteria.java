package org.patinanetwork.patchats.api.match.db.repos;

import java.time.Instant;
import java.util.Optional;
import lombok.Builder;

@Builder
public record MatchCycleFilterCriteria(
        Optional<String> period,
        Optional<Instant> startTime,
        Optional<Instant> endTime,
        Optional<Boolean> isDraft,
        int page,
        int pageSize) {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_PAGE_SIZE = 25;
    public static final int MAX_PAGE_SIZE = 100;

    public static class MatchCycleFilterCriteriaBuilder {
        private int page = DEFAULT_PAGE;
        private int pageSize = DEFAULT_PAGE_SIZE;
    }

    public MatchCycleFilterCriteria {
        if (page < 1) {
            throw new IllegalArgumentException("page must be at least 1");
        }
        if (pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("pageSize must be between 1 and " + MAX_PAGE_SIZE);
        }
    }

    public long offset() {
        return (long) (page - 1) * pageSize;
    }
}
