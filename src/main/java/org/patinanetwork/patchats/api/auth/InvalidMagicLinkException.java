package org.patinanetwork.patchats.api.auth;

/** Thrown when a presented magic-link token is unknown, already used, or expired. Maps to a 400 failure envelope. */
public class InvalidMagicLinkException extends RuntimeException {

    public InvalidMagicLinkException() {
        super("This sign-in link is invalid or has expired. Request a new one.");
    }
}
