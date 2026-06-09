package org.patinanetwork.patchats.email;

/** Port for delivering a single, fully-rendered email. Implementations own the transport. */
public interface EmailSender {

    /**
     * Delivers the given email.
     *
     * @throws org.springframework.mail.MailException if delivery fails
     */
    void send(OutgoingEmail email);
}
