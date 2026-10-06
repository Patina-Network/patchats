package org.patinanetwork.patchats.api.match.db.repos;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MatchSqlRepo implements MatchRepo {
    // Column names, also used as the matching named-parameter names in the SQL below.
    private static final String MEMBER_A_ID = "member_a_id";
    private static final String MEMBER_B_ID = "member_b_id";
    private static final String CYCLE_ID = "cycle_id";
    private static final String MATCH_SCORE = "match_score";
    private static final String STATUS = "status";

    // Every query returns the match plus its cycle period and both members' names. Each match has exactly one
    // cycle, member A and member B, so these joins never duplicate rows. Built only from constants, so the
    // resulting SQL is fixed at compile time; user values are always bound as parameters.
    private static final String DETAILS_COLUMNS = """
            SELECT
                m.*,
                c.period,
                a.first_name AS member_a_first_name,
                a.last_name AS member_a_last_name,
                b.first_name AS member_b_first_name,
                b.last_name AS member_b_last_name
            """;
    private static final String DETAILS_JOINS = """
            JOIN match_cycles c ON c.id = m.cycle_id
            JOIN members a ON a.id = m.member_a_id
            JOIN members b ON b.id = m.member_b_id
            """;

    /** Reads matches with their details. */
    private static final String SELECT_MATCHES = DETAILS_COLUMNS + "FROM matches m\n" + DETAILS_JOINS;

    /**
     * Reads the row produced by a write wrapped as {@code WITH m AS (... RETURNING *)}. RETURNING on its own can only
     * return columns of the matches table, so the write is wrapped to join the details onto its result.
     */
    private static final String SELECT_WRITTEN_MATCH = DETAILS_COLUMNS + "FROM m\n" + DETAILS_JOINS;

    private final JdbcClient jdbc;

    private Match parseResultSetToMatch(final ResultSet rs) throws SQLException {
        final Float matchScore = rs.getObject(MATCH_SCORE, Float.class);
        final String status = rs.getString(STATUS);
        return Match.builder()
                .id(UUID.fromString(rs.getString("id")))
                .memberAId(UUID.fromString(rs.getString(MEMBER_A_ID)))
                .memberBId(UUID.fromString(rs.getString(MEMBER_B_ID)))
                .matchCycleId(rs.getInt(CYCLE_ID))
                .matchScore(matchScore == null ? null : matchScore.doubleValue())
                .status(status == null ? null : MatchStatus.valueOf(status))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class).toInstant())
                .period(rs.getString("period"))
                .memberAFirstName(rs.getString("member_a_first_name"))
                .memberALastName(rs.getString("member_a_last_name"))
                .memberBFirstName(rs.getString("member_b_first_name"))
                .memberBLastName(rs.getString("member_b_last_name"))
                .build();
    }

    /** The JDBC driver cannot bind a Java enum, so status is stored as its name. */
    private static String statusToDb(final MatchStatus status) {
        return status == null ? null : status.name();
    }

    @Override
    public Match createMatch(Match match) {
        final String sql = """
            WITH m AS (
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
                RETURNING *
            )
        """ + SELECT_WRITTEN_MATCH;

        return jdbc.sql(sql)
                .param("id", match.getId())
                .param(MEMBER_A_ID, match.getMemberAId())
                .param(MEMBER_B_ID, match.getMemberBId())
                .param(CYCLE_ID, match.getMatchCycleId())
                .param(MATCH_SCORE, match.getMatchScore())
                .param(STATUS, statusToDb(match.getStatus()))
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .single();
    }

    @Override
    public Optional<Match> updateMatch(Match match) {
        final String sql = """
            WITH m AS (
              UPDATE "matches" SET
                "member_a_id" = :member_a_id,
                "member_b_id" = :member_b_id,
                "cycle_id"    = :cycle_id,
                "match_score" = :match_score,
                "status"      = :status
              WHERE "id" = :id
              RETURNING *
            )
        """ + SELECT_WRITTEN_MATCH;

        return jdbc.sql(sql)
                .param("id", match.getId())
                .param(MEMBER_A_ID, match.getMemberAId())
                .param(MEMBER_B_ID, match.getMemberBId())
                .param(CYCLE_ID, match.getMatchCycleId())
                .param(MATCH_SCORE, match.getMatchScore())
                .param(STATUS, statusToDb(match.getStatus()))
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public Optional<Match> getMatchById(UUID id) {
        final String sql = SELECT_MATCHES + "WHERE m.id = :id";
        return jdbc.sql(sql)
                .param("id", id)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public Optional<Match> setMatchStatus(UUID id, MatchStatus status) {
        final String sql = """
            WITH m AS (
              UPDATE "matches" SET "status" = :status
              WHERE "id" = :id
              RETURNING *
            )
        """ + SELECT_WRITTEN_MATCH;
        return jdbc.sql(sql)
                .param("id", id)
                .param(STATUS, statusToDb(status))
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public Optional<Match> setMatchScore(UUID id, Double score) {
        final String sql = """
            WITH m AS (
              UPDATE "matches" SET "match_score" = :score
              WHERE "id" = :id
              RETURNING *
            )
        """ + SELECT_WRITTEN_MATCH;
        return jdbc.sql(sql)
                .param("id", id)
                .param("score", score)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public Optional<Match> deleteMatchById(UUID id) {
        final String sql = "WITH m AS (DELETE FROM matches WHERE id = :id RETURNING *)\n" + SELECT_WRITTEN_MATCH;
        return jdbc.sql(sql)
                .param("id", id)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .optional();
    }

    @Override
    public List<Match> filterMatches(MatchFilterCriteria criteria) {
        StringBuilder sql = new StringBuilder(SELECT_MATCHES + "WHERE 1=1");
        MapSqlParameterSource params = new MapSqlParameterSource();

        criteria.status().ifPresent(status -> {
            sql.append(" AND m.status = :status");
            params.addValue(STATUS, statusToDb(status));
        });

        criteria.memberId().ifPresent(memberId -> {
            sql.append(" AND (m.member_a_id = :member_id OR m.member_b_id = :member_id)");
            params.addValue("member_id", memberId);
        });

        criteria.matchCycleId().ifPresent(cycleId -> {
            sql.append(" AND m.cycle_id = :cycle_id");
            params.addValue(CYCLE_ID, cycleId);
        });

        criteria.startTime().ifPresent(start -> {
            sql.append(" AND m.created_at >= :start_time");
            params.addValue("start_time", start.atOffset(ZoneOffset.UTC));
        });

        criteria.endTime().ifPresent(end -> {
            sql.append(" AND m.created_at <= :end_time");
            params.addValue("end_time", end.atOffset(ZoneOffset.UTC));
        });

        criteria.period().ifPresent(period -> {
            sql.append(" AND c.period = :period");
            params.addValue("period", period);
        });

        criteria.memberIndustry().ifPresent(memberIndustry -> {
            sql.append(" AND (LOWER(a.industry_pref) = LOWER(:member_industry)"
                    + " OR LOWER(b.industry_pref) = LOWER(:member_industry))");
            params.addValue("member_industry", memberIndustry);
        });

        // A stable order (id breaks created_at ties) keeps pages from repeating or skipping rows.
        sql.append(" ORDER BY m.created_at DESC, m.id LIMIT :page_size OFFSET :offset");
        params.addValue("page_size", criteria.pageSize());
        params.addValue("offset", criteria.offset());

        return jdbc.sql(sql.toString())
                .paramSource(params)
                .query((rs, rowNum) -> parseResultSetToMatch(rs))
                .list();
    }
}
