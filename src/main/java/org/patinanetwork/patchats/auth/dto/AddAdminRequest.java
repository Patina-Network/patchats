package org.patinanetwork.patchats.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Body of {@code POST /api/admins}: the email to allowlist and an optional note. */
public record AddAdminRequest(@NotBlank @Email String email, String note) {}
