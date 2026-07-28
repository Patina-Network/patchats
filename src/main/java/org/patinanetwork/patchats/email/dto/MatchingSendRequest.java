package org.patinanetwork.patchats.email.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request to send pairing notification emails. Accepts selected pairs and a template, then fans them into messages with
 * per-side (per1/per2) variables and calls the shared {@link EnqueueEmailRequest} producer with
 * {@code source=MATCHING}. The dedup guard (optional {@code matchesId}) is applied per pair.
 */
public record MatchingSendRequest(
        @NotNull UUID templateId,
        @Email String replyTo,
        @NotEmpty List<Pair> pairs,
        Map<String, String> sharedVariables) {

    /**
     * One pairing with per-side (A/B) member details. The {@code matchesId} is optional and used for the dedup guard.
     */
    public record Pair(
            UUID matchesId, @NotNull PairUser per1, @NotNull PairUser per2) {}

    /** Member details exported as {@code per1.*} and {@code per2.*} variables. */
    public record PairUser(
            @NotEmpty String name,
            @Email String email,
            String bio,
            String industry,
            String role,
            String topics,
            String linkedUrl) {}
}
