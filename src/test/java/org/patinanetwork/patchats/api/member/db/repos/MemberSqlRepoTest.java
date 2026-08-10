package org.patinanetwork.patchats.api.member.db.repos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;

class MemberSqlRepoTest {

    private static final String GET_MEMBERS_SQL = "SELECT * FROM members ORDER BY created_at DESC, id";

    @Test
    void getMembersReturnsRowsFromDatabase() {
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

        final List<Member> result = new MemberSqlRepo(jdbc).getMembers();

        assertEquals(List.of(member), result);
        verify(jdbc).sql(GET_MEMBERS_SQL);
        verify(query).list();
    }
}
