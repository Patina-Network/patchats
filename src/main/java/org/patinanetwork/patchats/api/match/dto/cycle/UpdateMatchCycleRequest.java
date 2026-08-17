package org.patinanetwork.patchats.api.match.dto.cycle;

import java.time.Instant;

public record UpdateMatchCycleRequest(Instant runAt, String period, Boolean isDraft) {}
