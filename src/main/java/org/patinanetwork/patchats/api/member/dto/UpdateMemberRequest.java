package org.patinanetwork.patchats.api.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateMemberRequest(
        @NotBlank String fullName,
        // TODO: Changes to email require verification after authentication is implemented
        @NotBlank @Email String email,
        String linkedInUrl,
        @NotBlank String introduction,
        String matchPref,
        String industryPref,
        String rolePref,
        String topics,
        String extraNotes) {}
