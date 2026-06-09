package org.patinanetwork.patchats.email;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Delivers email over SMTP via Spring's {@link JavaMailSender}. Plain-text only for now; adding HTML means switching to
 * {@code MimeMessageHelper} here, with no change to callers.
 */
@Component
@Profile("!dev")
@RequiredArgsConstructor
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final EmailProperties properties;

    @Override
    public void send(final OutgoingEmail email) {
        final SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.getFromHeader());
        message.setTo(email.to().toArray(new String[0]));
        message.setSubject(email.subject());
        message.setText(email.body());
        email.replyTo().ifPresent(message::setReplyTo);
        mailSender.send(message);
    }
}
