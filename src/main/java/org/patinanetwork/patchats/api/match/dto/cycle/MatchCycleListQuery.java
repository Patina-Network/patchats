package org.patinanetwork.patchats.api.match.dto.cycle;

import java.time.Instant;

public record MatchCycleListQuery(String period, Instant startTime, Instant endTime) {}
