package org.patinanetwork.patchats.api.match.dto.cycle;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateMatchCycleRequest(@NotNull Instant runAt, String period) {}
