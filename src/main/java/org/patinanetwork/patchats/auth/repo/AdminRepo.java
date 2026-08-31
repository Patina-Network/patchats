package org.patinanetwork.patchats.auth.repo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Plain-SQL access to {@code admins}, the hand-maintained allowlist of administrator emails. There is deliberately no
 * write path here: rows are inserted directly against the database, so this repository only ever asks the one question
 * sign-in needs.
 */
@Repository
@RequiredArgsConstructor
public class AdminRepo {

    private final JdbcClient jdbc;

    /**
     * Whether the address is on the admin allowlist. Accepts a raw address — member rows hold whatever sign-up was
     * given, so the caller has no canonical form to offer.
     *
     * <p>Normalisation is deliberately left to the database's {@code normalize_email}, the same function the table's
     * write trigger applies, rather than done here with {@code EmailNormalizer}. Two implementations of "canonical"
     * would have to agree forever — and where they disagreed (Postgres {@code LOWER} and Java's
     * {@code toLowerCase(Locale.ROOT)} part ways on some non-ASCII input) a correctly-listed admin would silently be
     * granted nothing. One definition, used by both sides, cannot drift.
     *
     * <p>Wrapping the parameter rather than the column keeps the primary-key index usable: {@code normalize_email} is
     * IMMUTABLE, so the planner folds it to a constant and does an index lookup.
     */
    public boolean isAdmin(final String email) {
        return Boolean.TRUE.equals(jdbc.sql("SELECT EXISTS(SELECT 1 FROM admins WHERE email = normalize_email(:email))")
                .param("email", email)
                .query(Boolean.class)
                .single());
    }
}
