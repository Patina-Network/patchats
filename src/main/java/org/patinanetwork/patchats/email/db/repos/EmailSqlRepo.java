package org.patinanetwork.patchats.email.db.repos;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.email.db.JsonbConverter;
import org.patinanetwork.patchats.email.db.models.Email;
import org.patinanetwork.patchats.email.db.models.EmailStatus;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EmailSqlRepo implements EmailRepo {

    private final JdbcClient jdbc;
    // JdbcClient has no batch API yet, so the N-child insert drops to JdbcTemplate (decision #19).
    private final JdbcTemplate jdbcTemplate;
    private final JsonbConverter jsonb;

    private Email parseResultSet(final ResultSet rs) throws SQLException {
        final Timestamp sentAt = rs.getTimestamp("sent_at");
        return Email.builder()
                .id(UUID.fromString(rs.getString("id")))
                .requestId(UUID.fromString(rs.getString("request_id")))
                .recipient1(rs.getString("recipient_1"))
                .recipient2(rs.getString("recipient_2"))
                .replyTo(rs.getString("reply_to"))
                .templateId(UUID.fromString(rs.getString("template_id")))
                .templateValues(jsonb.toMap(rs.getString("template_values")))
                .status(EmailStatus.valueOf(rs.getString("status")))
                .errorMessage(rs.getString("error_message"))
                .createdAt(rs.getTimestamp("created_at").toInstant())
                .updatedAt(rs.getTimestamp("updated_at").toInstant())
                .sentAt(sentAt == null ? null : sentAt.toInstant())
                .build();
    }

    private static PGobject jsonbObject(final String json) throws SQLException {
        final PGobject pg = new PGobject();
        pg.setType("jsonb");
        pg.setValue(json);
        return pg;
    }

    @Override
    public void insertAll(final List<Email> emails) {
        final String sql = """
                INSERT INTO "emails" (
                    id, request_id, recipient_1, recipient_2, reply_to,
                    template_id, template_values, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(final PreparedStatement ps, final int i) throws SQLException {
                final Email email = emails.get(i);
                ps.setObject(1, email.getId());
                ps.setObject(2, email.getRequestId());
                ps.setString(3, email.getRecipient1());
                ps.setString(4, email.getRecipient2());
                ps.setString(5, email.getReplyTo());
                ps.setObject(6, email.getTemplateId());
                ps.setObject(7, jsonbObject(jsonb.toJson(email.getTemplateValues())));
                ps.setString(
                        8,
                        email.getStatus() == null
                                ? EmailStatus.PENDING.name()
                                : email.getStatus().name());
            }

            @Override
            public int getBatchSize() {
                return emails.size();
            }
        });
    }

    @Override
    public List<Email> claimBatch(final int limit) {
        final String sql = """
                UPDATE emails SET status = 'PROCESSING', updated_at = now()
                 WHERE id IN (
                     SELECT id FROM emails WHERE status = 'PENDING' ORDER BY created_at LIMIT :limit
                 )
                RETURNING *
                """;
        return jdbc.sql(sql)
                .param("limit", limit)
                .query((rs, rowNum) -> parseResultSet(rs))
                .list();
    }

    @Override
    public void markSent(final UUID id) {
        jdbc.sql("UPDATE emails SET status = 'SENT', sent_at = now(), updated_at = now() WHERE id = :id")
                .param("id", id)
                .update();
    }

    @Override
    public void markError(final UUID id, final String errorMessage) {
        jdbc.sql("UPDATE emails SET status = 'ERROR', error_message = :msg, updated_at = now() WHERE id = :id")
                .param("id", id)
                .param("msg", errorMessage)
                .update();
    }

    @Override
    public int resetProcessingToError() {
        return jdbc.sql("""
                        UPDATE emails
                           SET status = 'ERROR',
                               error_message = 'Reset on startup: orphaned PROCESSING row (at-most-once recovery)',
                               updated_at = now()
                         WHERE status = 'PROCESSING'
                        """).update();
    }

    @Override
    public Map<EmailStatus, Integer> countByStatus(final UUID requestId) {
        final Map<EmailStatus, Integer> counts = new EnumMap<>(EmailStatus.class);
        jdbc.sql("SELECT status, count(*) AS cnt FROM emails WHERE request_id = :rid GROUP BY status")
                .param("rid", requestId)
                .query((rs, rowNum) -> {
                    counts.put(EmailStatus.valueOf(rs.getString("status")), rs.getInt("cnt"));
                    return null;
                })
                .list();
        return counts;
    }

    @Override
    public List<Email> findByRequest(final UUID requestId) {
        return jdbc.sql("SELECT * FROM emails WHERE request_id = :rid ORDER BY created_at")
                .param("rid", requestId)
                .query((rs, rowNum) -> parseResultSet(rs))
                .list();
    }

    @Override
    public Optional<Email> findById(final UUID id) {
        return jdbc.sql("SELECT * FROM emails WHERE id = :id")
                .param("id", id)
                .query((rs, rowNum) -> parseResultSet(rs))
                .optional();
    }

    @Override
    public int markPendingIfError(final UUID id) {
        return jdbc.sql("""
                        UPDATE emails SET status = 'PENDING', error_message = NULL, updated_at = now()
                         WHERE id = :id AND status = 'ERROR'
                        """).param("id", id).update();
    }
}
