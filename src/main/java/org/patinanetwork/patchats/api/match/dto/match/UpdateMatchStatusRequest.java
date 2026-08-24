package org.patinanetwork.patchats.api.match.dto.match;

import jakarta.validation.constraints.NotBlank;

public record UpdateMatchStatusRequest(@NotBlank String status) {}
