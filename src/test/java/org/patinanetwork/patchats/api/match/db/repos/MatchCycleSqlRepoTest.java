package org.patinanetwork.patchats.api.match.db.repos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;

@SuppressWarnings("unchecked")
class MatchCycleSqlRepoTest {

    @Test
    void createMatchCycleReturnsRowFromDatabase() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<MatchCycle> query = mock(JdbcClient.MappedQuerySpec.class);
        final MatchCycle matchCycle = MatchCycle.builder()
                .id(1)
                .period("2025-Q1")
                .runAt(Instant.parse("2025-01-15T12:00:00Z"))
                .isDraft(true)
                .build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<MatchCycle>>any())).thenReturn(query);
        when(query.single()).thenReturn(matchCycle);

        final MatchCycle result = new MatchCycleSqlRepo(jdbc).createMatchCycle(matchCycle);

        assertEquals(matchCycle, result);
        verify(jdbc).sql(ArgumentMatchers.anyString());
        verify(statement).param("period", matchCycle.getPeriod());
        verify(statement).param("run_at", matchCycle.getRunAt());
        verify(statement).param("is_draft", matchCycle.isDraft());
        verify(query).single();
    }

    @Test
    void updateMatchCycleBindsAllFields() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<MatchCycle> query = mock(JdbcClient.MappedQuerySpec.class);
        final MatchCycle matchCycle = MatchCycle.builder()
                .id(1)
                .period("2025-Q2")
                .runAt(Instant.parse("2025-04-15T12:00:00Z"))
                .isDraft(false)
                .build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<MatchCycle>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(matchCycle));

        final Optional<MatchCycle> result = new MatchCycleSqlRepo(jdbc).updateMatchCycle(matchCycle);

        assertTrue(result.isPresent());
        assertEquals(matchCycle, result.get());
        verify(statement).param("id", matchCycle.getId());
        verify(statement).param("period", matchCycle.getPeriod());
        verify(statement).param("run_at", matchCycle.getRunAt());
        verify(statement).param("is_draft", matchCycle.isDraft());
        verify(query).optional();
    }

    @Test
    void getMatchCycleByIdBindsId() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<MatchCycle> query = mock(JdbcClient.MappedQuerySpec.class);
        final MatchCycle matchCycle = MatchCycle.builder().id(1).build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<MatchCycle>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(matchCycle));

        final Optional<MatchCycle> result = new MatchCycleSqlRepo(jdbc).getMatchCycleById(1);

        assertTrue(result.isPresent());
        assertEquals(matchCycle, result.get());
        verify(statement).param("id", 1);
        verify(query).optional();
    }

    @Test
    void setMatchCycleDraftBindsDraft() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<MatchCycle> query = mock(JdbcClient.MappedQuerySpec.class);
        final MatchCycle matchCycle = MatchCycle.builder().id(1).isDraft(false).build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<MatchCycle>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(matchCycle));

        final Optional<MatchCycle> result = new MatchCycleSqlRepo(jdbc).setMatchCycleDraft(1, false);

        assertTrue(result.isPresent());
        assertEquals(matchCycle, result.get());
        verify(statement).param("id", 1);
        verify(statement).param("is_draft", false);
        verify(query).optional();
    }

    @Test
    void deleteMatchCycleByIdBindsId() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<MatchCycle> query = mock(JdbcClient.MappedQuerySpec.class);
        final MatchCycle matchCycle = MatchCycle.builder().id(1).build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<MatchCycle>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(matchCycle));

        final Optional<MatchCycle> result = new MatchCycleSqlRepo(jdbc).deleteMatchCycleById(1);

        assertTrue(result.isPresent());
        assertEquals(matchCycle, result.get());
        verify(statement).param("id", 1);
        verify(query).optional();
    }

    @Test
    void filterMatchCyclesAppliesEveryProvidedCriterion() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<MatchCycle> query = mock(JdbcClient.MappedQuerySpec.class);
        final Instant start = Instant.parse("2025-01-01T00:00:00Z");
        final Instant end = Instant.parse("2025-06-30T23:59:59Z");
        final MatchCycleFilterCriteria criteria = new MatchCycleFilterCriteria(
                Optional.of("2025-Q1"), Optional.of(start), Optional.of(end), Optional.of(true));

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.paramSource(ArgumentMatchers.any(MapSqlParameterSource.class)))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<MatchCycle>>any())).thenReturn(query);
        when(query.list()).thenReturn(java.util.List.of());

        final java.util.List<MatchCycle> result = new MatchCycleSqlRepo(jdbc).filterMatchCycles(criteria);

        assertEquals(java.util.List.of(), result);
        verify(jdbc).sql(ArgumentMatchers.anyString());
        verify(query).list();
    }

    @Test
    void filterMatchCyclesOnlyIncludesProvidedCriteriaInWhereClause() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<MatchCycle> query = mock(JdbcClient.MappedQuerySpec.class);
        final MatchCycleFilterCriteria criteria = new MatchCycleFilterCriteria(
                Optional.of("2025-Q1"), Optional.empty(), Optional.empty(), Optional.of(true));
        final ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.paramSource(ArgumentMatchers.any(MapSqlParameterSource.class)))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<MatchCycle>>any())).thenReturn(query);
        when(query.list()).thenReturn(java.util.List.of());

        new MatchCycleSqlRepo(jdbc).filterMatchCycles(criteria);

        verify(jdbc).sql(sqlCaptor.capture());
        assertEquals(
                "SELECT * FROM match_cycles WHERE 1=1 AND period = :period AND is_draft = :is_draft",
                sqlCaptor.getValue());
    }
}
