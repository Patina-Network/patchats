package org.patinanetwork.patchats.api.match.dto.match;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateMatchRequest(
        @NotNull UUID memberAId,
        @NotNull UUID memberBId,
        @NotNull Integer matchCycleId,
        Double matchScore,
        String status) {}
