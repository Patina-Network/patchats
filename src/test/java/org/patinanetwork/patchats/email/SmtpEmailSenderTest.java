package org.patinanetwork.patchats.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.mail.javamail.JavaMailSenderImpl;

class SmtpEmailSenderTest {

    @RegisterExtension
    static final GreenMailExtension GREEN_MAIL =
            new GreenMailExtension(ServerSetupTest.SMTP).withConfiguration(GreenMailConfiguration.aConfig());

    @Test
    void deliversPlainTextToBothRecipients() throws Exception {
        final JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("localhost");
        mailSender.setPort(GREEN_MAIL.getSmtp().getPort());

        final EmailProperties properties = new EmailProperties();
        properties.setFrom("coffeechats@patinanetwork.org");
        properties.setFromName("PatChats");

        final SmtpEmailSender sender = new SmtpEmailSender(mailSender, properties);
        sender.send(new OutgoingEmail(
                List.of("ann@example.com", "bob@example.com"),
                "You're paired!",
                "Hi Ann and Bob.",
                Optional.of("coordinator@patinanetwork.org")));

        assertTrue(GREEN_MAIL.waitForIncomingEmail(5000, 2));
        final MimeMessage[] received = GREEN_MAIL.getReceivedMessages();
        assertEquals(2, received.length);

        final MimeMessage message = received[0];
        assertEquals("You're paired!", message.getSubject());
        assertEquals("PatChats <coffeechats@patinanetwork.org>", message.getFrom()[0].toString());
        assertEquals("coordinator@patinanetwork.org", message.getReplyTo()[0].toString());
        assertTrue(GreenMailUtil.getBody(message).contains("Hi Ann and Bob."));
    }
}
