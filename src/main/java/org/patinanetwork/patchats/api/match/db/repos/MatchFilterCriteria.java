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
        Optional<MatchStatus> status) {}
