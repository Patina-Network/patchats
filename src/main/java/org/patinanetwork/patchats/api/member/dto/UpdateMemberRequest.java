package org.patinanetwork.patchats.api.member.dto;

import jakarta.validation.constraints.Email;
import java.util.Optional;

public record UpdateMemberRequest(
        Optional<String> firstName,
        Optional<String> lastName,
        // TODO: Changes to email require verification after authentication is implemented
        Optional<@Email String> email,
        Optional<String> linkedInUrl,
        Optional<String> introduction,
        Optional<String> matchPref,
        Optional<String> industryPref,
        Optional<String> rolePref,
        Optional<String> topics,
        Optional<String> extraNotes) {}
