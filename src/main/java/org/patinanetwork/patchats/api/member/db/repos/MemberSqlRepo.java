package org.patinanetwork.patchats.api.member.db.repos;

import java.sql.ResultSet;
import java.sql.SQLException;
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
                .fullName(rs.getString("full_name"))
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
                .createdAt(rs.getTimestamp("created_at").toInstant())
                .updatedAt(rs.getTimestamp("updated_at").toInstant())
                .build();
    }

    @Override
    public Member createMember(Member member) {
        String sql = """
            INSERT INTO "members"
                (id, "full_name", "email","linked_in_url","introduction","referral_source",active, "match_pref", "industry_pref", "role_pref", "topics", "extra_notes")
            VALUES
                (:id, :full_name, :email, :linked_in_url, :introduction, :referral_source, :active , :match_pref, :industry_pref, :role_pref, :topics, :extra_notes)
            RETURNING
                *
            """;
        return jdbc.sql(sql)
                .param("id", member.getId())
                .param("full_name", member.getFullName())
                .param("email", member.getEmail())
                .param("linked_in_url", member.getLinkedInUrl())
                .param("introduction", member.getIntroduction())
                .param("referral_source", member.getReferralSource())
                .param("active", member.isActive())
                .param("match_pref", member.getMatchPref())
                .param("industry_pref", member.getIndustryPref())
                .param("role_pref", member.getRolePref())
                .param("topics", member.getTopics())
                .param("extra_notes", member.getExtraNotes())
                .query((rs, rowNum) -> parseResultSetToMember(rs))
                .single();
    }

    @Override
    public Optional<Member> updateMember(Member member) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Optional<Member> getMemberById(UUID id) {
        throw new UnsupportedOperationException("Not implemented yet");
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
