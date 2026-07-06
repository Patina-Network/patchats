package org.patinanetwork.patchats.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Body of {@code POST /api/auth/request-link}. */
public record RequestLinkRequest(@NotBlank @Email String email) {}
