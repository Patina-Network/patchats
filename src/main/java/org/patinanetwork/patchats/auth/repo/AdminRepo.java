package org.patinanetwork.patchats.auth.repo;

import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.utilities.EmailNormalizer;
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
     * Whether the address is on the admin allowlist.
     *
     * <p>The argument is normalised before the lookup because member rows are not guaranteed to hold a canonical
     * address (sign-up stores what was typed), while the table's {@code admins_email_normalized} CHECK guarantees every
     * stored row is canonical. Normalising here is what makes the two sides meet.
     */
    public boolean isAdmin(final String email) {
        return Boolean.TRUE.equals(jdbc.sql("SELECT EXISTS(SELECT 1 FROM admins WHERE email = :email)")
                .param("email", EmailNormalizer.normalize(email))
                .query(Boolean.class)
                .single());
    }
}
