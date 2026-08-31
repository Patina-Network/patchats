package org.patinanetwork.patchats.api.match.db.repos;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MatchCycleSqlRepo implements MatchCycleRepo {
    private final JdbcClient jdbc;

    private MatchCycle parseResultSetToMatchCycle(final ResultSet rs) throws SQLException {
        return MatchCycle.builder()
                .id(rs.getInt("id"))
                .period(rs.getString("period"))
                .runAt(rs.getObject("run_at", OffsetDateTime.class).toInstant())
                .isDraft(rs.getBoolean("is_draft"))
                .build();
    }

    @Override
    public MatchCycle createMatchCycle(MatchCycle matchCycle) {
        String sql = """
            INSERT INTO "match_cycles" (
                "period",
                "run_at",
                "is_draft"
            )
            VALUES(
                :period,
                :run_at,
                :is_draft
            )
            RETURNING *
        """;

        return jdbc.sql(sql)
                .param("period", matchCycle.getPeriod())
                .param("run_at", matchCycle.getRunAt())
                .param("is_draft", matchCycle.getIsDraft())
                .query((rs, rowNum) -> parseResultSetToMatchCycle(rs))
                .single();
    }

    @Override
    public Optional<MatchCycle> updateMatchCycle(MatchCycle matchCycle) {
        String sql = """
            UPDATE "match_cycles" SET
                "period"        = :period,
                "run_at"        = :run_at,
                "is_draft"       = :is_draft
            WHERE "id" = :id
            RETURNING *
        """;

        return jdbc.sql(sql)
                .param("id", matchCycle.getId())
                .param("period", matchCycle.getPeriod())
                .param("run_at", matchCycle.getRunAt())
                .param("is_draft", matchCycle.getIsDraft())
                .query((rs, rowNum) -> parseResultSetToMatchCycle(rs))
                .optional();
    }

    @Override
    public Optional<MatchCycle> getMatchCycleById(Integer id) {
        String sql = """
            SELECT *
            FROM match_cycles
            WHERE id = :id
        """;
        return jdbc.sql(sql)
                .param("id", id)
                .query((rs, rowNum) -> parseResultSetToMatchCycle(rs))
                .optional();
    }

    @Override
    public Optional<MatchCycle> getMatchCycleByPeriod(String period) {
        String sql = """
            SELECT *
            FROM match_cycles
            WHERE period = :period
        """;
        return jdbc.sql(sql)
                .param("period", id)
                .query((rs, rowNum) -> parseResultSetToMatchCycle(rs))
                .optional();
    }

    @Override
    public Optional<MatchCycle> setMatchCycleDraft(Integer id, boolean isDraft) {
        String sql = """
            UPDATE "match_cycles" SET
                "is_draft" = :is_draft
            WHERE "id" = :id
            RETURNING *
        """;

        return jdbc.sql(sql)
                .param("id", id)
                .param("is_draft", isDraft)
                .query((rs, rowNum) -> parseResultSetToMatchCycle(rs))
                .optional();
    }

    @Override
    public Optional<MatchCycle> deleteMatchCycleById(Integer id) {
        String sql = """
            DELETE FROM match_cycles
            WHERE id = :id
            RETURNING *
        """;
        return jdbc.sql(sql)
                .param("id", id)
                .query((rs, rowNum) -> parseResultSetToMatchCycle(rs))
                .optional();
    }

    @Override
    public List<MatchCycle> filterMatchCycles(MatchCycleFilterCriteria criteria) {
        StringBuilder sql = new StringBuilder("SELECT * FROM match_cycles WHERE 1=1");
        MapSqlParameterSource params = new MapSqlParameterSource();

        criteria.period().ifPresent(period -> {
            sql.append(" AND period = :period");
            params.addValue("period", period);
        });

        criteria.startTime().ifPresent(start -> {
            sql.append(" AND run_at >= :start_time");
            params.addValue("start_time", start);
        });

        criteria.endTime().ifPresent(end -> {
            sql.append(" AND run_at <= :end_time");
            params.addValue("end_time", end);
        });

        criteria.isDraft().ifPresent(isDraft -> {
            sql.append(" AND is_draft = :is_draft");
            params.addValue("is_draft", isDraft);
        });

        return jdbc.sql(sql.toString())
                .paramSource(params)
                .query((rs, rowNum) -> parseResultSetToMatchCycle(rs))
                .list();
    }
}
