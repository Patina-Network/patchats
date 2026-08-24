package org.patinanetwork.patchats.api.match.dto.match;

import java.time.Instant;
import java.util.UUID;

public record MatchListQuery(UUID memberId, String period, Instant startTime, Instant endTime, String status) {}
