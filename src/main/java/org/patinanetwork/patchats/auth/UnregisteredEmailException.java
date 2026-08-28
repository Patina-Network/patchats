package org.patinanetwork.patchats.auth;

/**
 * Thrown when a sign-in link is requested for an email with no member row. Maps to a 404 failure envelope so the login
 * page can offer the two real choices — try another address, or sign up.
 *
 * <p>This is a <em>deliberate</em> disclosure of account existence, chosen over the previous silent-success behaviour
 * because that left people waiting for an email that was never going to arrive. The request-link rate limiter is what
 * keeps the disclosure from being cheap to farm; it runs before the existence check, so being throttled still reveals
 * nothing.
 */
public class UnregisteredEmailException extends RuntimeException {

    public UnregisteredEmailException() {
        super("We couldn't find an account for that email.");
    }
}
