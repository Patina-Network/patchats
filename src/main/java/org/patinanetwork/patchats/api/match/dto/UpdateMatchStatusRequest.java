package org.patinanetwork.patchats.api.match.dto;

import jakarta.validation.constraints.NotNull;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;

public record UpdateMatchStatusRequest(@NotNull MatchStatus status) {}
