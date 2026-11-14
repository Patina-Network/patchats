package org.patinanetwork.patchats.api.match.dto;

import java.util.UUID;

public record UpdateMatchRequest(UUID memberAId, UUID memberBId, Integer matchCycleId) {}
