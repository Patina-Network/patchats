package org.patinanetwork.patchats.api.match.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record CreateMatchCycleRequest(@NotBlank String period, Instant runAt, Boolean isDraft) {}
