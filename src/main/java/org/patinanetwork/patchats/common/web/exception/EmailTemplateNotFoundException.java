package org.patinanetwork.patchats.common.web.exception;

import java.util.UUID;

/** A request referenced a {@code templateId} that does not exist. Surfaced as a 400 (client-supplied bad reference). */
public class EmailTemplateNotFoundException extends RuntimeException {
    public EmailTemplateNotFoundException(final UUID id) {
        super("Email template with ID " + id + " not found");
    }
}
