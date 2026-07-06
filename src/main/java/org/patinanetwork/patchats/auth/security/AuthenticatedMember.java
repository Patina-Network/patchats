package org.patinanetwork.patchats.auth.security;

import java.io.Serializable;
import java.security.Principal;
import java.util.UUID;
import org.patinanetwork.patchats.api.member.db.models.Member;

/**
 * The security principal stored in the session. Must stay {@link Serializable} (and small): Spring Session JDBC
 * serializes the whole {@code SecurityContext} into {@code spring_session_attributes}. Implementing {@link Principal}
 * gives {@code Authentication.getName()} — and Spring Session's {@code PRINCIPAL_NAME} index — the member's email.
 */
public record AuthenticatedMember(UUID memberId, String email) implements Principal, Serializable {

    public static AuthenticatedMember of(final Member member) {
        return new AuthenticatedMember(member.getId(), member.getEmail());
    }

    @Override
    public String getName() {
        return email;
    }
}
