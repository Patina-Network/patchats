package org.patinanetwork.patchats.api.member.dto;

import jakarta.validation.constraints.Email;

public record UpdateMemberRequest(
        String firstName,
        String lastName,
        // TODO: Changes to email require verification after authentication is implemented
        @Email String email,
        String linkedInUrl,
        String introduction,
        String matchPref,
        String industryPref,
        String rolePref,
        String topics,
        String extraNotes) {}
