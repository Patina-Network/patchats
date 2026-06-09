package org.patinanetwork.patchats.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Dev-profile sender that logs the rendered email instead of delivering it, so local dev needs no SMTP server. */
@Component
@Profile("dev")
@Slf4j
public class LoggingEmailSender implements EmailSender {

    @Override
    public void send(final OutgoingEmail email) {
        log.info(
                "[DEV] Email NOT delivered. to={} replyTo={} subject={}\n{}",
                email.to(),
                email.replyTo().orElse("<none>"),
                email.subject(),
                email.body());
    }
}
