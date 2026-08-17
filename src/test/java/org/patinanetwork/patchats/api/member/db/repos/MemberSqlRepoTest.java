package org.patinanetwork.patchats.api.member.db.repos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;

class MemberSqlRepoTest {

    private static final String GET_MEMBERS_SQL = """
        SELECT
            *
        FROM
            members
        ORDER BY
            created_at DESC,
            id
        """;
    private static final String GET_FILTERED_MEMBERS_SQL = """
        SELECT
            *
        FROM
            members
        WHERE
            LOWER(first_name) = LOWER(:first_name)
        AND
            LOWER(last_name) = LOWER(:last_name)
        AND
            LOWER(email) = LOWER(:email)
        AND
            active = :active
        AND
            LOWER(match_pref) = LOWER(:match_pref)
        AND
            LOWER(industry_pref) = LOWER(:industry_pref)
        AND
            LOWER(role_pref) = LOWER(:role_pref)
        AND
            LOWER(topics) = LOWER(:topics)
        ORDER BY
            created_at DESC,
            id
        """;

    @Test
    void getMembersAllReturnsRowsFromDatabase() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Member> query = mock(JdbcClient.MappedQuerySpec.class);
        final Member member = Member.builder()
                .id(UUID.randomUUID())
                .firstName("Alex")
                .lastName("Morgan")
                .email("alex@example.com")
                .active(true)
                .build();

        when(jdbc.sql(GET_MEMBERS_SQL)).thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Member>>any())).thenReturn(query);
        when(query.list()).thenReturn(List.of(member));

        final List<Member> result = new MemberSqlRepo(jdbc).getMembersByFilters(MemberFilterCriteria.empty());

        assertEquals(List.of(member), result);
        verify(jdbc).sql(GET_MEMBERS_SQL);
        verify(query).list();
    }

    @Test
    void getMembersByFiltersAppliesEveryProvidedCriterion() {
        final JdbcClient jdbc = mock(JdbcClient.class);
        final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
        final JdbcClient.MappedQuerySpec<Member> query = mock(JdbcClient.MappedQuerySpec.class);
        final MemberFilterCriteria criteria = new MemberFilterCriteria(
                Optional.of("Alex"),
                Optional.of("Morgan"),
                Optional.of("alex@example.com"),
                Optional.of(true),
                Optional.of("Peer"),
                Optional.of("Technology"),
                Optional.of("Engineering"),
                Optional.of("Community"));

        when(jdbc.sql(GET_FILTERED_MEMBERS_SQL)).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Member>>any())).thenReturn(query);
        when(query.list()).thenReturn(List.of());

        final List<Member> result = new MemberSqlRepo(jdbc).getMembersByFilters(criteria);

        assertEquals(List.of(), result);
        verify(jdbc).sql(GET_FILTERED_MEMBERS_SQL);
        verify(statement).param("first_name", "Alex");
        verify(statement).param("last_name", "Morgan");
        verify(statement).param("email", "alex@example.com");
        verify(statement).param("active", true);
        verify(statement).param("match_pref", "Peer");
        verify(statement).param("industry_pref", "Technology");
        verify(statement).param("role_pref", "Engineering");
        verify(statement).param("topics", "Community");
        verify(query).list();
    }
}
