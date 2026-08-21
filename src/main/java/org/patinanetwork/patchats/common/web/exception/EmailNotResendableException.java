package org.patinanetwork.patchats.common.web.exception;

import java.util.UUID;

/** A resend was requested for a row that is not in {@code ERROR}. Surfaced as a 409 (conflicting state). */
public class EmailNotResendableException extends RuntimeException {
    public EmailNotResendableException(final UUID id) {
        super("Email with ID " + id + " is not in ERROR state and cannot be resent");
    }
}
