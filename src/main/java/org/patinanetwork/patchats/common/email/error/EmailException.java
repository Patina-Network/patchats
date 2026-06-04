package org.patinanetwork.patchats.common.email.error;

/** Base exception for {@link org.patinanetwork.patchats.common.email.EmailClient} */
public class EmailException extends Exception {

    public EmailException() {
        super();
    }

    public EmailException(final String message) {
        super(message);
    }

    public EmailException(final String message, final Throwable e) {
        super(message, e);
    }
}
