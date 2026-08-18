package org.patinanetwork.patchats.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executor;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.email.db.models.Email;
import org.patinanetwork.patchats.email.db.models.EmailStatus;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;
import org.patinanetwork.patchats.email.db.repos.EmailRepo;
import org.patinanetwork.patchats.email.db.repos.EmailTemplateRepo;
import org.springframework.mail.MailSendException;

class EmailDrainerTest {

    private static final UUID TEMPLATE_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final EmailRepo emailRepo = mock(EmailRepo.class);
    private final EmailTemplateRepo templateRepo = mock(EmailTemplateRepo.class);
    private final EmailSender sender = mock(EmailSender.class);
    private final EmailRenderer renderer = new EmailRenderer(new TemplateRenderer());

    /** Runs submitted jobs inline on the calling thread, so a drain completes synchronously within trigger(). */
    private static final Executor SYNC = Runnable::run;

    private EmailDrainer drainer(final Executor executor) {
        return new EmailDrainer(emailRepo, templateRepo, renderer, sender, executor);
    }

    private EmailTemplate template(final String subject, final String body) {
        return EmailTemplate.builder()
                .id(TEMPLATE_ID)
                .name("t")
                .subject(subject)
                .body(body)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private Email email(final Map<String, String> values, final String recipient2) {
        return Email.builder()
                .id(UUID.randomUUID())
                .requestId(UUID.randomUUID())
                .recipient1("ann@x.com")
                .recipient2(recipient2)
                .templateId(TEMPLATE_ID)
                .templateValues(values)
                .status(EmailStatus.PROCESSING)
                .build();
    }

    @Test
    void rendersEachRowFromItsTemplateThenMarksSent() {
        final Email row = email(Map.of("per1.name", "Ann"), null);
        when(emailRepo.claimBatch(50)).thenReturn(List.of(row), List.of());
        when(templateRepo.findById(TEMPLATE_ID))
                .thenReturn(Optional.of(template("Hi ${per1.name}", "Body ${per1.name}")));

        drainer(SYNC).trigger();

        final ArgumentCaptor<OutgoingEmail> sent = ArgumentCaptor.forClass(OutgoingEmail.class);
        verify(sender).send(sent.capture());
        assertEquals("Hi Ann", sent.getValue().subject());
        assertEquals("Body Ann", sent.getValue().body());
        assertEquals(List.of("ann@x.com"), sent.getValue().to());
        verify(emailRepo).markSent(row.getId());
        verify(emailRepo, never()).markError(any(), any());
        verify(emailRepo, atLeastOnce()).claimBatch(50); // claims in batches of ≤50
    }

    @Test
    void pairRowSendsToBothRecipients() {
        final Email row = email(Map.of("per1.name", "Ann", "per2.name", "Bob"), "bob@x.com");
        when(emailRepo.claimBatch(50)).thenReturn(List.of(row), List.of());
        when(templateRepo.findById(TEMPLATE_ID))
                .thenReturn(Optional.of(template("Hi ${per1.name} & ${per2.name}", "b")));

        drainer(SYNC).trigger();

        final ArgumentCaptor<OutgoingEmail> sent = ArgumentCaptor.forClass(OutgoingEmail.class);
        verify(sender).send(sent.capture());
        assertEquals(List.of("ann@x.com", "bob@x.com"), sent.getValue().to());
        assertEquals("Hi Ann & Bob", sent.getValue().subject());
    }

    @Test
    void sendFailureIsTerminalErrorWithNoRetry() {
        final Email row = email(Map.of("per1.name", "Ann"), null);
        when(emailRepo.claimBatch(50)).thenReturn(List.of(row), List.of());
        when(templateRepo.findById(TEMPLATE_ID)).thenReturn(Optional.of(template("Hi ${per1.name}", "b")));
        doThrow(new MailSendException("smtp down")).when(sender).send(any());

        drainer(SYNC).trigger();

        verify(sender, times(1)).send(any()); // one attempt only
        verify(emailRepo).markError(eq(row.getId()), any());
        verify(emailRepo, never()).markSent(any());
    }

    @Test
    void renderFailureIsTerminalError() {
        // Required ${per1.name} has no value → renderer throws → row goes straight to ERROR, nothing sent.
        final Email row = email(Map.of(), null);
        when(emailRepo.claimBatch(50)).thenReturn(List.of(row), List.of());
        when(templateRepo.findById(TEMPLATE_ID)).thenReturn(Optional.of(template("Hi ${per1.name}", "b")));

        drainer(SYNC).trigger();

        verify(sender, never()).send(any());
        verify(emailRepo).markError(eq(row.getId()), any());
        verify(emailRepo, never()).markSent(any());
    }

    @Test
    void startupResetsProcessingToErrorThenDrains() {
        when(emailRepo.resetProcessingToError()).thenReturn(2);
        when(emailRepo.claimBatch(50)).thenReturn(List.of());

        drainer(SYNC).onApplicationReady();

        verify(emailRepo).resetProcessingToError();
        verify(emailRepo).claimBatch(50); // the startup kick still runs a drain pass
    }

    @Test
    void overlappingTriggersCoalesceToOneDrain() {
        // A manual executor that captures jobs without running them, to observe submission count.
        final List<Runnable> submitted = new ArrayList<>();
        final Executor capturing = submitted::add;
        when(emailRepo.claimBatch(50)).thenReturn(List.of());
        final EmailDrainer drainer = drainer(capturing);

        drainer.trigger(); // running := true, one job submitted
        drainer.trigger(); // running already true → no second submission, rerun flagged
        assertEquals(1, submitted.size());

        submitted.get(0).run(); // drain runs, honours the rerun flag internally, then clears running
        assertEquals(1, submitted.size()); // still exactly one drain submission
    }
}
