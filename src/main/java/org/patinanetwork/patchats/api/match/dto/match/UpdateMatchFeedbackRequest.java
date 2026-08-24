package org.patinanetwork.patchats.api.match.dto.match;

import jakarta.validation.constraints.NotBlank;

public record UpdateMatchFeedbackRequest(@NotBlank String feedback) {}
