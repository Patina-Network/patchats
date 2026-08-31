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
    void normalisesTheEmailBeforeLookingItUp() {
        // Member rows can hold whatever sign-up was given, but every admins row is canonical (CHECK constraint),
        // so an un-normalised lookup would silently never match.
        final JdbcClient jdbc = stubbedClient(true);
        final JdbcClient.StatementSpec statement = jdbc.sql("");

        new AdminRepo(jdbc).isAdmin("  Ann@Example.COM  ");

        verify(statement).param("email", "ann@example.com");
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
