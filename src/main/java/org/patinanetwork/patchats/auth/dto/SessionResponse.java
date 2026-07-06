package org.patinanetwork.patchats.auth.dto;

import org.patinanetwork.patchats.api.member.db.models.Member;

/**
 * The signed-in member as seen by the frontend. Members always have a complete profile (the sign-up form is the only
 * way one is created), so {@code name} is always present. {@code isAdmin} is always false until the admin domain lands.
 */
public record SessionResponse(String id, String name, String email, boolean isAdmin) {

    public static SessionResponse of(final Member member) {
        final String name = "%s %s".formatted(member.getFirstName(), member.getLastName());
        return new SessionResponse(member.getId().toString(), name, member.getEmail(), false);
    }
}
