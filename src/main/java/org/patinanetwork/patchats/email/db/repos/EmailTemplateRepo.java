package org.patinanetwork.patchats.email.db.repos;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;

/**
 * Access to {@code email_templates}. Read/list only in Increment 1 (templates are seeded and read-only); create/delete
 * arrive in Increment 5. Templates are immutable — there is deliberately no update.
 */
public interface EmailTemplateRepo {

    Optional<EmailTemplate> findById(UUID id);

    List<EmailTemplate> findAll();

    /** Creates a new template. Returns the generated UUID. */
    UUID create(String name, String subject, String body);

    /**
     * Soft-deletes a template (sets {@code deleted_at}). Returns the number of rows updated (0 if not found or already
     * deleted).
     */
    int softDelete(UUID id);

    /** Checks if a template name is already in use (excluding soft-deleted rows). */
    boolean nameExists(String name);

    /** Counts non-deleted rows that reference this template. Blocks hard-delete if count > 0. */
    long countEmailsReferencing(UUID templateId);
}
