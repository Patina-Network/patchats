package org.patinanetwork.patchats.api.match.db.repos;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;

public record MatchFilterCriteria(
        Optional<Instant> startTime,
        Optional<Instant> endTime,
        Optional<String> period,
        Optional<UUID> memberId,
        Optional<Integer> matchCycleId,
        Optional<String> memberIndustry,
        Optional<MatchStatus> status,
        int page,
        int pageSize) {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_PAGE_SIZE = 25;
    public static final int MAX_PAGE_SIZE = 100;

    public MatchFilterCriteria {
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
