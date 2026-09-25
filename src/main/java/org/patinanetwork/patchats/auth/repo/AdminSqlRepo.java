package org.patinanetwork.patchats.auth.repo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Plain-SQL implementation of {@link AdminRepo}. */
@Repository
@RequiredArgsConstructor
public class AdminSqlRepo implements AdminRepo {

    private final JdbcClient jdbc;

    /**
     * Normalisation is deliberately left to the database's {@code normalize_email}, the same function the table's write
     * trigger applies. Wrapping the parameter rather than the column also keeps the primary-key index usable.
     */
    @Override
    public boolean isAdmin(final String email) {
        return Boolean.TRUE.equals(jdbc.sql("SELECT EXISTS(SELECT 1 FROM admins WHERE email = normalize_email(:email))")
                .param("email", email)
                .query(Boolean.class)
                .single());
    }
}
