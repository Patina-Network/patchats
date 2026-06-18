package org.patinanetwork.patchats.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.email.dto.SendEmailRequest;
import org.patinanetwork.patchats.email.dto.SendEmailResponse;
import org.springframework.mail.MailSendException;

class EmailServiceTest {

    private final EmailSender sender = mock(EmailSender.class);
    private final EmailService service = new EmailService(new TemplateRenderer(), sender);

    @Test
    void sendsPairAsOneEmailWithNamespacedVariables() {
        final SendEmailRequest request = new SendEmailRequest(
                "Hi ${rec1.firstName} & ${rec2.firstName}",
                "Paired for ${month}. LinkedIn: ${rec2.linkedIn:N/A}",
                null,
                List.of(new SendEmailRequest.Message(
                        Map.of("month", "July"),
                        List.of(
                                new SendEmailRequest.Recipient("ann@x.com", Map.of("firstName", "Ann")),
                                new SendEmailRequest.Recipient("bob@x.com", Map.of("firstName", "Bob"))))));

        final SendEmailResponse response = service.send(request);

        assertEquals(1, response.sent());
        assertEquals(0, response.failed());

        final ArgumentCaptor<OutgoingEmail> captor = ArgumentCaptor.forClass(OutgoingEmail.class);
        verify(sender).send(captor.capture());
        final OutgoingEmail email = captor.getValue();
        assertEquals(List.of("ann@x.com", "bob@x.com"), email.to());
        assertEquals("Hi Ann & Bob", email.subject());
        assertTrue(email.body().contains("Paired for July"));
        assertTrue(email.body().contains("N/A"));
    }

    @Test
    void missingRequiredVariableFailsOnlyThatMessage() {
        final SendEmailRequest request = new SendEmailRequest(
                "Hi ${rec1.firstName}",
                "Body",
                null,
                List.of(
                        new SendEmailRequest.Message(
                                null,
                                List.of(new SendEmailRequest.Recipient("good@x.com", Map.of("firstName", "Ann")))),
                        new SendEmailRequest.Message(
                                null, List.of(new SendEmailRequest.Recipient("bad@x.com", Map.of())))));

        final SendEmailResponse response = service.send(request);

        assertEquals(1, response.sent());
        assertEquals(1, response.failed());
        assertTrue(response.results().get(0).sent());
        assertFalse(response.results().get(1).sent());
    }

    @Test
    void smtpFailureIsReportedPerMessage() {
        doThrow(new MailSendException("smtp down")).when(sender).send(any());
        final SendEmailRequest request = new SendEmailRequest(
                "S",
                "B",
                null,
                List.of(new SendEmailRequest.Message(
                        null, List.of(new SendEmailRequest.Recipient("a@x.com", Map.of())))));

        final SendEmailResponse response = service.send(request);

        assertEquals(0, response.sent());
        assertEquals(1, response.failed());
        assertFalse(response.results().get(0).sent());
    }
}
