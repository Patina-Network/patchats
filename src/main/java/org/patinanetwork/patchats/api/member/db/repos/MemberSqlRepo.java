package org.patinanetwork.patchats.api.member.db.repos;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MemberSqlRepo implements MemberRepo {

    private final JdbcClient jdbc;

    private Member parseResultSetToMember(final ResultSet rs) throws SQLException {
        return Member.builder()
                .id(UUID.fromString(rs.getString("id")))
                .firstName(rs.getString("first_name"))
                .lastName(rs.getString("last_name"))
                .email(rs.getString("email"))
                .linkedInUrl(rs.getString("linked_in_url"))
                .introduction(rs.getString("introduction"))
                .referralSource(rs.getString("referral_source"))
                .active(rs.getBoolean("active"))
                .matchPref(rs.getString("match_pref"))
                .industryPref(rs.getString("industry_pref"))
                .rolePref(rs.getString("role_pref"))
                .topics(rs.getString("topics"))
                .extraNotes(rs.getString("extra_notes"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .build();
    }

    private JdbcClient.StatementSpec bindMemberParams(JdbcClient.StatementSpec spec, Member member) {
        return spec
                .param("id", member.getId())
                .param("first_name", member.getFirstName())
                .param("last_name", member.getLastName())
                .param("email", member.getEmail())
                .param("linked_in_url", member.getLinkedInUrl())
                .param("introduction", member.getIntroduction())
                .param("referral_source", member.getReferralSource())
                .param("active", member.isActive())
                .param("match_pref", member.getMatchPref())
                .param("industry_pref", member.getIndustryPref())
                .param("role_pref", member.getRolePref())
                .param("topics", member.getTopics())
                .param("extra_notes", member.getExtraNotes());
    }

    @Override
    public Member createMember(Member member) {
        String sql = """
            INSERT INTO "members" (
                "id",
                "first_name",
                "last_name",
                "email",
                "linked_in_url",
                "introduction",
                "referral_source",
                "active",
                "match_pref",
                "industry_pref",
                "role_pref",
                "topics",
                "extra_notes"
            )
            VALUES(
                :id,
                :first_name,
                :last_name,
                :email,
                :linked_in_url,
                :introduction,
                :referral_source,
                :active ,
                :match_pref,
                :industry_pref,
                :role_pref,
                :topics,
                :extra_notes
            )
            RETURNING
                *
        """;
        return bindMemberParams(jdbc.sql(sql), member)
                .query((rs, rowNum) -> parseResultSetToMember(rs))
                .single();
    }

    @Override
    public List<Member> getMembers() {
        String sql = "SELECT * FROM members ORDER BY created_at DESC, id";
        return jdbc.sql(sql).query((rs, rowNum) -> parseResultSetToMember(rs)).list();
    }

    @Override
    public Optional<Member> updateMember(Member member) {
        String sql = """
            UPDATE "members" SET
                "first_name" = :first_name,
                "last_name" = :last_name,
                "email" = :email,
                "linked_in_url" = :linked_in_url,
                "introduction" = :introduction,
                "referral_source" = :referral_source,
                "active" = :active,
                "match_pref" = :match_pref,
                "industry_pref" = :industry_pref,
                "role_pref" = :role_pref,
                "topics" = :topics,
                "extra_notes" = :extra_notes,
                "updated_at" = NOW()
            WHERE "id" = :id
            RETURNING *
        """;
        return bindMemberParams(jdbc.sql(sql), member)
                .query((rs, rowNum) -> parseResultSetToMember(rs))
                .optional();
    }

    @Override
    public Optional<Member> getMemberById(UUID id) {
        String sql = "SELECT * FROM members WHERE id = :id";
        return jdbc.sql(sql)
                .param("id", id)
                .query((rs, rowNum) -> parseResultSetToMember(rs))
                .optional();
    }

    @Override
    public Optional<Member> getMemberByEmail(String email) {
        String sql = "SELECT * FROM members WHERE email = :email";
        return jdbc.sql(sql)
                .param("email", email)
                .query((rs, rowNum) -> parseResultSetToMember(rs))
                .optional();
    }

    @Override
    public Optional<Member> deactivateMemberById(UUID id) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
