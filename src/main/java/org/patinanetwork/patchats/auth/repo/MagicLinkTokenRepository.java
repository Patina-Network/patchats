package org.patinanetwork.patchats.auth.repo;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Plain-SQL access to {@code magic_link_tokens}. Only token hashes ever touch this table. */
@Repository
@RequiredArgsConstructor
public class MagicLinkTokenRepository {

    private final JdbcClient jdbc;

    /** Invalidates every outstanding link for an email; called before issuing a new one. */
    public void deleteByEmail(final String email) {
        jdbc.sql("DELETE FROM magic_link_tokens WHERE email = :email")
                .param("email", email)
                .update();
    }

    public void insertToken(final UUID id, final String email, final String tokenHash, final Instant expiresAt) {
        jdbc.sql("INSERT INTO magic_link_tokens (id, email, token_hash, expires_at)"
                        + " VALUES (:id, :email, :tokenHash, :expiresAt)")
                .param("id", id)
                .param("email", email)
                .param("tokenHash", tokenHash)
                .param("expiresAt", expiresAt.atOffset(ZoneOffset.UTC))
                .update();
    }

    /**
     * Atomically consumes an unexpired, unused token and returns the email it was issued to. The single UPDATE
     * guarantees a token can only ever log in one caller, even under concurrent requests.
     *
     * <p>Returns {@link Optional#empty()} for unknown, already-consumed, <em>and</em> expired tokens alike — the
     * uniformity is deliberate: callers surface one generic "invalid or expired" outcome, so presenting tokens never
     * becomes an oracle for which failure occurred or whether an email exists in the system.
     */
    public Optional<String> consumeAndReturnEmail(final String tokenHash, final Instant now) {
        return jdbc.sql("UPDATE magic_link_tokens SET consumed_at = :now"
                        + " WHERE token_hash = :tokenHash AND consumed_at IS NULL AND expires_at > :now"
                        + " RETURNING email")
                .param("tokenHash", tokenHash)
                .param("now", now.atOffset(ZoneOffset.UTC))
                .query(String.class)
                .optional();
    }
}
