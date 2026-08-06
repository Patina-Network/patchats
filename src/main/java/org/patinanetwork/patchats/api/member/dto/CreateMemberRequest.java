package org.patinanetwork.patchats.api.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateMemberRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        String linkedInUrl,
        @NotBlank String introduction,
        String referralSource,
        String matchPref,
        String industryPref,
        String rolePref,
        String topics,
        String extraNotes) {}
