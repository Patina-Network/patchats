package org.patinanetwork.patchats.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Body of {@code POST /api/auth/verify}: the raw token from the emailed link. */
public record VerifyRequest(@NotBlank String token) {}
