package org.patinanetwork.patchats.email.db.repos;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EmailTemplateSqlRepo implements EmailTemplateRepo {

    private final JdbcClient jdbc;

    static EmailTemplate parseResultSet(final ResultSet rs) throws SQLException {
        return EmailTemplate.builder()
                .id(UUID.fromString(rs.getString("id")))
                .name(rs.getString("name"))
                .subject(rs.getString("subject"))
                .body(rs.getString("body"))
                .createdAt(rs.getTimestamp("created_at").toInstant())
                .updatedAt(rs.getTimestamp("updated_at").toInstant())
                .build();
    }

    @Override
    public Optional<EmailTemplate> findById(final UUID id) {
        return jdbc.sql("SELECT * FROM email_templates WHERE id = :id")
                .param("id", id)
                .query((rs, rowNum) -> parseResultSet(rs))
                .optional();
    }

    @Override
    public List<EmailTemplate> findAll() {
        return jdbc.sql("SELECT * FROM email_templates ORDER BY name")
                .query((rs, rowNum) -> parseResultSet(rs))
                .list();
    }

    @Override
    public UUID create(final String name, final String subject, final String body) {
        final UUID id = UUID.randomUUID();
        jdbc.sql(
                        "INSERT INTO email_templates (id, name, subject, body, created_at, updated_at) VALUES (:id, :name, :subject, :body, NOW(), NOW())")
                .param("id", id)
                .param("name", name)
                .param("subject", subject)
                .param("body", body)
                .update();
        return id;
    }

    @Override
    public int softDelete(final UUID id) {
        return jdbc.sql("DELETE FROM email_templates WHERE id = :id")
                .param("id", id)
                .update();
    }

    @Override
    public boolean nameExists(final String name) {
        final Integer count = jdbc.sql("SELECT COUNT(*) FROM email_templates WHERE name = :name")
                .param("name", name)
                .query(Integer.class)
                .single();
        return count > 0;
    }

    @Override
    public long countEmailsReferencing(final UUID templateId) {
        final Long count = jdbc.sql("SELECT COUNT(*) FROM emails WHERE template_id = :templateId")
                .param("templateId", templateId)
                .query(Long.class)
                .single();
        return count != null ? count : 0;
    }
}
