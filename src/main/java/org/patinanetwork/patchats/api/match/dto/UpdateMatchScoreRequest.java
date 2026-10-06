package org.patinanetwork.patchats.api.match.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMatchScoreRequest(@NotNull Double score) {}
