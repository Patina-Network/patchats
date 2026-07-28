package org.patinanetwork.patchats.common.web.exception;

import java.util.UUID;

/** No {@code emails} row exists with the given id. Surfaced as a 404. */
public class EmailNotFoundException extends RuntimeException {
    public EmailNotFoundException(final UUID id) {
        super("Email with ID " + id + " not found");
    }
}
