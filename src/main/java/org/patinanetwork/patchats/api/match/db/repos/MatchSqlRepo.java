package org.patinanetwork.patchats.api.match.db.repos;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MatchSqlRepo implements MatchRepo {
    private final JdbcClient jdbc;

    private Match parseResultSetToMatch(final ResultSet rs) throws SQLException {
        return Match.builder()
                .id(UUID.fromString(rs.getString("id")))
                .memberAId(UUID.fromString(rs.getString("member_a_id")))
                .memberBId(UUID.fromString(rs.getString("member_b_id")))
                .matchCycleId(rs.getInt("cycle_id"))
                .matchScore(rs.getObject("match_score", Double.class))
                .status(rs.getString("status"))
                .createdAt(rs.getObject("created_at", Instant.class))
                .build();
    }

    @Override
    public Match createMatch(Match match) {
        String sql = """
            INSERT INTO "matches" (
                "id",
                "member_a_id",
                "member_b_id",
                "cycle_id",
                "match_score",
                "status"
            )
            VALUES(
                :id,
                :member_a_id,
                :member_b_id,
                :cycle_id,
                :match_score,
                :status
            )
            RETURNING
                *
        """;
        return jdbc.sql(sql)
                .param("id", match.getId())
                .param("member_a_id", match.getMemberAId())
                .param("member_b_id", match.getMemberBId())
                .param("cycle_id", match.getMatchCycleId())
                .param("match_score", match.getMatchScore())
                .param("status", match.getStatus())
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .single();
    }

    @Override
    public Optional<Match> updateMatch(Match match) {
        String sql = """
          UPDATE "matches" SET
            "member_a_id" = :member_a_id,
            "member_b_id" = :member_b_id,
            "cycle_id"    = :cycle_id,
            "match_score" = :match_score,
            "status"      = :status
          WHERE "id" = :id
          RETURNING *
        """;
        return jdbc.sql(sql)
                .param("id", match.getId())
                .param("member_a_id", match.getMemberAId())
                .param("member_b_id", match.getMemberBId())
                .param("cycle_id", match.getMatchCycleId())
                .param("match_score", match.getMatchScore())
                .param("status", match.getStatus())
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public Optional<Match> getMatchById(UUID id) {
        String sql = "SELECT * FROM matches WHERE id = :id";
        return jdbc.sql(sql)
                .param("id", id)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public Optional<Match> setMatchStatus(UUID id, String status) {
        String sql = """
          UPDATE "matches" SET "status" = :status
          WHERE "id" = :id
          RETURNING *
        """;
        return jdbc.sql(sql)
                .param("id", id)
                .param("status", status)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public Optional<Match> deleteMatchById(UUID id) {
        String sql = "DELETE FROM matches WHERE id = :id RETURNING *";
        return jdbc.sql(sql)
                .param("id", id)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public List<Match> filterMatches(MatchFilterCriteria criteria) {
        StringBuilder sql = new StringBuilder("SELECT * FROM matches WHERE 1=1");
        MapSqlParameterSource params = new MapSqlParameterSource();

        criteria.status().ifPresent(status -> {
            sql.append(" AND status = :status");
            params.addValue("status", status);
        });

        criteria.memberId().ifPresent(memberId -> {
            sql.append(" AND (member_a_id = :member_id OR member_b_id = :member_id)");
            params.addValue("member_id", memberId);
        });

        criteria.matchCycleId().ifPresent(cycleId -> {
            sql.append(" AND cycle_id = :cycle_id");
            params.addValue("cycle_id", cycleId);
        });

        criteria.startTime().ifPresent(start -> {
            sql.append(" AND created_at >= :start_time");
            params.addValue("start_time", start);
        });

        criteria.endTime().ifPresent(end -> {
            sql.append(" AND created_at <= :end_time");
            params.addValue("end_time", end);
        });

        criteria.period().ifPresent(period -> {
            sql.append(" AND cycle_id IN (SELECT id FROM match_cycles WHERE period = :period)");
            params.addValue("period", period);
        });

        criteria.memberIndustry().ifPresent(memberIndustry -> {
            sql.append(" AND (");
            sql.append("member_a_id IN (SELECT id FROM members WHERE industry_pref = :member_industry)");
            sql.append(" OR ");
            sql.append("member_b_id IN (SELECT id FROM members WHERE industry_pref = :member_industry)");
            sql.append(")");
            params.addValue("member_industry", memberIndustry);
        });

        return jdbc.sql(sql.toString())
                .paramSource(params)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .list();
    }
}
