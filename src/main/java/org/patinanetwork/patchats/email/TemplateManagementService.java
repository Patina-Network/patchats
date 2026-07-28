package org.patinanetwork.patchats.email;

import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;
import org.patinanetwork.patchats.email.db.repos.EmailTemplateRepo;
import org.patinanetwork.patchats.email.dto.CreateTemplateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Manages template CRUD (Increment 5): validates syntax, enforces uniqueness, and protects referenced templates from
 * deletion. Templates are immutable — no edit endpoint.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateManagementService {

    private final EmailTemplateRepo templateRepo;
    private final EmailRenderer renderer;

    /**
     * Creates a new template after validating the name (unique, non-blank) and syntax (dry-run render against sample
     * vars). Rejects if any validation fails (e.g., malformed ${} syntax, duplicate name).
     */
    @Transactional
    public UUID createTemplate(final CreateTemplateRequest request) {
        // Validate uniqueness
        if (templateRepo.nameExists(request.name())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Template name '%s' is already in use".formatted(request.name()));
        }

        // Validate syntax by attempting a dry-run render with sample + shared variables
        final Map<String, String> sampleVars = Map.ofEntries(
                Map.entry("per1.name", "Sample Person One"),
                Map.entry("per1.email", "sample.one@example.com"),
                Map.entry("per1.bio", "Sample bio for person one"),
                Map.entry("per1.industry", "Sample Industry"),
                Map.entry("per1.role", "Sample Role"),
                Map.entry("per1.topics", "Sample Topic A, Sample Topic B"),
                Map.entry("per1.linkedUrl", "https://example.com/sample-one"),
                Map.entry("per2.name", "Sample Person Two"),
                Map.entry("per2.email", "sample.two@example.com"),
                Map.entry("per2.bio", "Sample bio for person two"),
                Map.entry("per2.industry", "Sample Industry"),
                Map.entry("per2.role", "Sample Role"),
                Map.entry("per2.topics", "Sample Topic C, Sample Topic D"),
                Map.entry("per2.linkedUrl", "https://example.com/sample-two"));

        try {
            final EmailTemplate templateToValidate = EmailTemplate.builder()
                    .subject(request.subject())
                    .body(request.body())
                    .build();
            renderer.render(templateToValidate, sampleVars);
        } catch (final Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Template syntax error: %s".formatted(e.getMessage()), e);
        }

        // Create and return the new template's UUID
        final UUID templateId = templateRepo.create(request.name(), request.subject(), request.body());
        log.info("Created template {} ({})", templateId, request.name());
        return templateId;
    }

    /**
     * Soft-deletes a template. Rejects if the template is referenced by any non-ERROR email rows (the dedup guard logic
     * requires immutability: a queued row must never have its template deleted out from under it). Uses soft-delete so
     * past audit history is preserved.
     */
    @Transactional
    public void deleteTemplate(final UUID templateId) {
        final long referencingCount = templateRepo.countEmailsReferencing(templateId);
        if (referencingCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot delete template %s: %d email(s) reference it".formatted(templateId, referencingCount));
        }

        final int updated = templateRepo.softDelete(templateId);
        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Template %s not found or already deleted".formatted(templateId));
        }
        log.info("Soft-deleted template {}", templateId);
    }
}
