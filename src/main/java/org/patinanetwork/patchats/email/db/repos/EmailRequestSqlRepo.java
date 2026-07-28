package org.patinanetwork.patchats.email.db.repos;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.email.db.models.EmailRequest;
import org.patinanetwork.patchats.email.db.models.EmailRequestCounts;
import org.patinanetwork.patchats.email.db.models.EmailSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EmailRequestSqlRepo implements EmailRequestRepo {

    private final JdbcClient jdbc;

    static EmailRequest parseResultSet(final ResultSet rs) throws SQLException {
        return EmailRequest.builder()
                .id(UUID.fromString(rs.getString("id")))
                .label(rs.getString("label"))
                .senderEmail(rs.getString("sender_email"))
                .source(EmailSource.valueOf(rs.getString("source")))
                .templateId(rs.getString("template_id") == null ? null : UUID.fromString(rs.getString("template_id")))
                .totalCount(rs.getInt("total_count"))
                .createdAt(rs.getTimestamp("created_at").toInstant())
                .build();
    }

    @Override
    public EmailRequest insert(final EmailRequest request) {
        final String sql = """
                INSERT INTO "email_requests" (id, label, sender_email, source, template_id, total_count)
                VALUES (:id, :label, :sender_email, :source, :template_id, :total_count)
                RETURNING *
                """;
        return jdbc.sql(sql)
                .param("id", request.getId())
                .param("label", request.getLabel())
                .param("sender_email", request.getSenderEmail())
                .param("source", request.getSource().name())
                .param("template_id", request.getTemplateId())
                .param("total_count", request.getTotalCount())
                .query((rs, rowNum) -> parseResultSet(rs))
                .single();
    }

    @Override
    public List<EmailRequestCounts> listWithCounts() {
        final String sql = """
                SELECT r.id, r.source, r.template_id, r.created_at, r.total_count,
                       count(*) FILTER (WHERE e.status = 'SENT')  AS sent,
                       count(*) FILTER (WHERE e.status = 'ERROR') AS error,
                       count(*) FILTER (WHERE e.status IN ('PENDING', 'PROCESSING')) AS in_flight
                  FROM email_requests r
                  JOIN emails e ON e.request_id = r.id
                 GROUP BY r.id
                 ORDER BY r.created_at DESC
                """;
        return jdbc.sql(sql)
                .query((rs, rowNum) -> new EmailRequestCounts(
                        UUID.fromString(rs.getString("id")),
                        EmailSource.valueOf(rs.getString("source")),
                        rs.getString("template_id") == null ? null : UUID.fromString(rs.getString("template_id")),
                        rs.getTimestamp("created_at").toInstant(),
                        rs.getInt("total_count"),
                        rs.getInt("sent"),
                        rs.getInt("error"),
                        rs.getInt("in_flight")))
                .list();
    }
}
