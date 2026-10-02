package org.patinanetwork.patchats.api.match.dto;

import java.time.Instant;
import java.util.Optional;

public record UpdateMatchCycleRequest(Optional<String> period, Optional<Instant> runAt, Optional<Boolean> isDraft) {}
