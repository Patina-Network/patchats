package org.patinanetwork.patchats.api.match.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;

public record CreateMatchRequest(
        @NotNull UUID memberAId,
        @NotNull UUID memberBId,
        @NotNull Integer matchCycleId,
        Double matchScore,
        MatchStatus status) {}
