package org.patinanetwork.patchats.api.match.db.repos;

import java.time.Instant;
import java.util.Optional;

public record MatchCycleFilterCriteria(
        Optional<String> period, Optional<Instant> startTime, Optional<Instant> endTime, Optional<Boolean> isDraft) {

    public static MatchCycleFilterCriteria empty() {
        return new MatchCycleFilterCriteria(Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty());
    }
}
