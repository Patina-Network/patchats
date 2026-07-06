package org.patinanetwork.patchats.auth;

/**
 * Thrown when the request-link rate limit is hit. Maps to HTTP 429 with a friendly message. The limiter runs before the
 * member-existence check, so the 429 is registration-blind — it reveals nothing about whether the email has an account.
 */
public class TooManyLinkRequestsException extends RuntimeException {

    public TooManyLinkRequestsException() {
        super("Too many sign-in requests. Please wait a few minutes and try again.");
    }
}
