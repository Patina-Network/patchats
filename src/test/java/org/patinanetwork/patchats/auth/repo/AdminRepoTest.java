package org.patinanetwork.patchats.auth.repo;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.jdbc.core.simple.JdbcClient;

class AdminRepoTest {

    @Test
    void reportsAnAllowlistedEmailAsAdmin() {
        final JdbcClient jdbc = stubbedClient(true);

        assertTrue(new AdminRepo(jdbc).isAdmin("ann@example.com"));
    }

    @Test
    void reportsAnAbsentEmailAsNotAdmin() {
        final JdbcClient jdbc = stubbedClient(false);

        assertFalse(new AdminRepo(jdbc).isAdmin("stranger@example.com"));
    }

    @Test
    void passesTheAddressThroughUntouchedAndLetsSqlNormaliseIt() {
        // Canonicalisation is the database's normalize_email(), the same function the table's write trigger uses, so
        // that one definition serves both sides. Doing it here as well would be a second definition free to drift.
        // NOTE: this only pins the contract — that the raw address reaches SQL wrapped in normalize_email. Whether
        // the normalisation is itself correct lives in the migration and is covered manually, not here; these repo
        // tests mock JdbcClient and never touch Postgres.
        final JdbcClient jdbc = stubbedClient(true);
        final JdbcClient.StatementSpec statement = jdbc.sql("");

        new AdminRepo(jdbc).isAdmin("  Ann@Example.COM  ");

        verify(statement).param("email", "  Ann@Example.COM  ");
        verify(jdbc).sql(ArgumentMatchers.contains("normalize_email(:email)"));
    }

    /** A {@link JdbcClient} whose single query resolves to {@code result}; the same statement mock is reused. */
    private static JdbcClient stubbedClient(final Boolean result) {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        @SuppressWarnings("unchecked")
        final JdbcClient.MappedQuerySpec<Boolean> query = mock(JdbcClient.MappedQuerySpec.class);

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(Boolean.class)).thenReturn(query);
        when(query.single()).thenReturn(result);
        return jdbc;
    }
}
