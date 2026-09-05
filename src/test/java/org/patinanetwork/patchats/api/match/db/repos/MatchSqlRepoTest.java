package org.patinanetwork.patchats.api.match.db.repos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;

@SuppressWarnings("unchecked")
class MatchSqlRepoTest {

    @Test
    void createMatchReturnsRowFromDatabase() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final Match match = Match.builder()
                .id(UUID.randomUUID())
                .memberAId(UUID.randomUUID())
                .memberBId(UUID.randomUUID())
                .matchCycleId(1)
                .matchScore(8.5)
                .status("pending")
                .build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.single()).thenReturn(match);

        final Match result = new MatchSqlRepo(jdbc).createMatch(match);

        assertEquals(match, result);
        verify(jdbc).sql(ArgumentMatchers.anyString());
        verify(statement).param("id", match.getId());
        verify(statement).param("member_a_id", match.getMemberAId());
        verify(statement).param("member_b_id", match.getMemberBId());
        verify(statement).param("cycle_id", match.getMatchCycleId());
        verify(statement).param("match_score", match.getMatchScore());
        verify(statement).param("status", match.getStatus());
        verify(query).single();
    }

    @Test
    void updateMatchBindsAllFields() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final Match match = Match.builder()
                .id(UUID.randomUUID())
                .memberAId(UUID.randomUUID())
                .memberBId(UUID.randomUUID())
                .matchCycleId(2)
                .matchScore(9.0)
                .status("confirmed")
                .build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(match));

        final Optional<Match> result = new MatchSqlRepo(jdbc).updateMatch(match);

        assertTrue(result.isPresent());
        assertEquals(match, result.get());
        verify(statement).param("id", match.getId());
        verify(statement).param("member_a_id", match.getMemberAId());
        verify(statement).param("member_b_id", match.getMemberBId());
        verify(statement).param("cycle_id", match.getMatchCycleId());
        verify(statement).param("match_score", match.getMatchScore());
        verify(statement).param("status", match.getStatus());
        verify(query).optional();
    }

    @Test
    void getMatchByIdBindsId() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final UUID id = UUID.randomUUID();
        final Match match = Match.builder().id(id).build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(match));

        final Optional<Match> result = new MatchSqlRepo(jdbc).getMatchById(id);

        assertTrue(result.isPresent());
        assertEquals(match, result.get());
        verify(statement).param("id", id);
        verify(query).optional();
    }

    @Test
    void setMatchStatusBindsStatus() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final UUID id = UUID.randomUUID();
        final Match match = Match.builder().id(id).status("completed").build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(match));

        final Optional<Match> result = new MatchSqlRepo(jdbc).setMatchStatus(id, "completed");

        assertTrue(result.isPresent());
        assertEquals(match, result.get());
        verify(statement).param("id", id);
        verify(statement).param("status", "completed");
        verify(query).optional();
    }

    @Test
    void setMatchScoreBindsScore() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final UUID id = UUID.randomUUID();
        final Match match = Match.builder().id(id).matchScore(7.25).build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(match));

        final Optional<Match> result = new MatchSqlRepo(jdbc).setMatchScore(id, 7.25);

        assertTrue(result.isPresent());
        assertEquals(match, result.get());
        verify(statement).param("id", id);
        verify(statement).param("score", 7.25);
        verify(query).optional();
    }

    @Test
    void deleteMatchByIdBindsId() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final UUID id = UUID.randomUUID();
        final Match match = Match.builder().id(id).build();

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.optional()).thenReturn(Optional.of(match));

        final Optional<Match> result = new MatchSqlRepo(jdbc).deleteMatchById(id);

        assertTrue(result.isPresent());
        assertEquals(match, result.get());
        verify(statement).param("id", id);
        verify(query).optional();
    }

    @Test
    void filterMatchesAppliesEveryProvidedCriterion() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final Instant start = Instant.parse("2025-01-01T00:00:00Z");
        final Instant end = Instant.parse("2025-06-30T23:59:59Z");
        final MatchFilterCriteria criteria = new MatchFilterCriteria(
                Optional.of(start),
                Optional.of(end),
                Optional.of("2025-Q1"),
                Optional.of(UUID.randomUUID()),
                Optional.of(1),
                Optional.of("Technology"),
                Optional.of("confirmed"));

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.paramSource(ArgumentMatchers.any(MapSqlParameterSource.class)))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.list()).thenReturn(java.util.List.of());

        final java.util.List<Match> result = new MatchSqlRepo(jdbc).filterMatches(criteria);

        assertEquals(java.util.List.of(), result);
        verify(jdbc).sql(ArgumentMatchers.anyString());
        verify(query).list();
    }

    @Test
    void filterMatchesOnlyIncludesProvidedCriteriaInWhereClause() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Match> query = mock(JdbcClient.MappedQuerySpec.class);
        final MatchFilterCriteria criteria = new MatchFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.of("2025-Q1"),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.of("pending"));
        final ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);

        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.paramSource(ArgumentMatchers.any(MapSqlParameterSource.class)))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Match>>any())).thenReturn(query);
        when(query.list()).thenReturn(java.util.List.of());

        new MatchSqlRepo(jdbc).filterMatches(criteria);

        verify(jdbc).sql(sqlCaptor.capture());
        assertEquals(
                "SELECT * FROM matches WHERE 1=1 AND status = :status AND cycle_id IN (SELECT id FROM match_cycles WHERE period = :period)",
                sqlCaptor.getValue());
    }
}
