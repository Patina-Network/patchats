package org.patinanetwork.patchats.api.member.db.repos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;

class MemberSqlRepoTest {

    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
    private final JdbcClient.MappedQuerySpec<Member> query = mock(JdbcClient.MappedQuerySpec.class);
    private final MemberSqlRepo memberSqlRepo = new MemberSqlRepo(jdbc);

    @BeforeEach
    void setUp() {
        when(jdbc.sql(ArgumentMatchers.anyString())).thenReturn(statement);
        when(statement.params(ArgumentMatchers.anyMap())).thenReturn(statement);
        when(statement.param(ArgumentMatchers.anyString(), ArgumentMatchers.any()))
                .thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Member>>any())).thenReturn(query);
    }

    @Test
    void getMembersAll_returnsRowsFromDatabase() {
        final MemberFilterCriteria criteria = emptyCriteria();
        final Member member = Member.builder()
                .id(UUID.randomUUID())
                .firstName("Alex")
                .lastName("Morgan")
                .email("alex@example.com")
                .active(true)
                .build();

        when(query.list()).thenReturn(List.of(member));

        final List<Member> result = memberSqlRepo.getMembersByFilters(criteria);

        assertEquals(List.of(member), result);
        verify(jdbc).sql(ArgumentMatchers.anyString());
        verify(statement).param("page_size", MemberFilterCriteria.DEFAULT_PAGE_SIZE);
        verify(statement).param("offset", 0L);
        verify(query).list();
    }

    @Test
    void getMembersByFilters_appliesEveryProvidedCriterion() {
        final MemberFilterCriteria criteria = new MemberFilterCriteria(
                Optional.of("Alex"),
                Optional.of("Morgan"),
                Optional.of("alex@example.com"),
                Optional.of(true),
                Optional.of("Peer"),
                Optional.of("Technology"),
                Optional.of("Engineering"),
                Optional.of("Community"),
                3,
                20);

        when(query.list()).thenReturn(List.of());

        final List<Member> result = memberSqlRepo.getMembersByFilters(criteria);

        assertEquals(List.of(), result);
        verify(jdbc).sql(ArgumentMatchers.anyString());
        verify(statement)
                .params(Map.of(
                        "first_name", "Alex",
                        "last_name", "Morgan",
                        "email", "alex@example.com",
                        "active", true,
                        "match_pref", "Peer",
                        "industry_pref", "Technology",
                        "role_pref", "Engineering",
                        "topics", "Community"));
        verify(statement).param("page_size", 20);
        verify(statement).param("offset", 40L);
        verify(query).list();
    }

    @Test
    void getMembersByFilters_onlyIncludesProvidedCriteriaInWhereClause() {
        final MemberFilterCriteria criteria = new MemberFilterCriteria(
                Optional.of("Alex"),
                Optional.empty(),
                Optional.empty(),
                Optional.of(true),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.of("Community"),
                MemberFilterCriteria.DEFAULT_PAGE,
                MemberFilterCriteria.DEFAULT_PAGE_SIZE);
        final ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);

        when(query.list()).thenReturn(List.of());

        memberSqlRepo.getMembersByFilters(criteria);

        verify(jdbc).sql(sqlCaptor.capture());
        assertEquals("""
                SELECT
                    *
                FROM
                    members
                WHERE
                    LOWER(first_name) = LOWER(:first_name)
                AND
                    active = :active
                AND
                    LOWER(topics) = LOWER(:topics)
                ORDER BY
                    created_at DESC,
                    id
                LIMIT
                    :page_size
                OFFSET
                    :offset
                """, sqlCaptor.getValue());
        verify(statement).params(Map.of("first_name", "Alex", "active", true, "topics", "Community"));
    }

    private static MemberFilterCriteria emptyCriteria() {
        return new MemberFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                MemberFilterCriteria.DEFAULT_PAGE,
                MemberFilterCriteria.DEFAULT_PAGE_SIZE);
    }
}
