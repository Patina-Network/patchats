package org.patinanetwork.patchats.email.dto;

import java.time.Instant;
import java.util.UUID;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;

/** API view of a template for the read-only list ({@code GET /api/email/templates}) and the template manager. */
public record EmailTemplateResponse(UUID id, String name, String subject, String body, Instant createdAt) {

    public static EmailTemplateResponse from(final EmailTemplate template) {
        return new EmailTemplateResponse(
                template.getId(),
                template.getName(),
                template.getSubject(),
                template.getBody(),
                template.getCreatedAt());
    }
}
