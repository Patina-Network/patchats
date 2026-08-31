package org.patinanetwork.patchats.auth.dto;

import org.patinanetwork.patchats.api.member.db.models.Member;

/**
 * The signed-in member as seen by the frontend. Members always have a complete profile (the sign-up form is the only
 * way one is created), so {@code name} is always present.
 *
 * <p>{@code isAdmin} is passed in rather than read off the member because the member row knows nothing about admin
 * status — it comes from the {@code admins} allowlist, resolved once at sign-in and carried by the session's granted
 * authorities. Callers must derive it from those authorities so the flag the SPA renders and the rule the backend
 * enforces can never disagree.
 */
public record SessionResponse(String id, String name, String email, boolean isAdmin) {

    public static SessionResponse of(final Member member, final boolean isAdmin) {
        final String name = "%s %s".formatted(member.getFirstName(), member.getLastName());
        return new SessionResponse(member.getId().toString(), name, member.getEmail(), isAdmin);
    }
}
