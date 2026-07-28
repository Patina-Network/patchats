package org.patinanetwork.patchats.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.common.web.exception.EmailNotFoundException;
import org.patinanetwork.patchats.common.web.exception.EmailNotResendableException;
import org.patinanetwork.patchats.email.db.models.Email;
import org.patinanetwork.patchats.email.db.models.EmailRequestCounts;
import org.patinanetwork.patchats.email.db.models.EmailSource;
import org.patinanetwork.patchats.email.db.models.EmailStatus;
import org.patinanetwork.patchats.email.db.repos.EmailRepo;
import org.patinanetwork.patchats.email.db.repos.EmailRequestRepo;
import org.patinanetwork.patchats.email.dto.EmailProgressResponse;
import org.patinanetwork.patchats.email.dto.EmailRequestSummary;

class EmailProgressServiceTest {

    private final EmailRepo emailRepo = mock(EmailRepo.class);
    private final EmailRequestRepo requestRepo = mock(EmailRequestRepo.class);
    private final EmailDrainer drainer = mock(EmailDrainer.class);
    private final EmailProgressService service = new EmailProgressService(emailRepo, requestRepo, drainer);

    private Email row(final EmailStatus status, final String recipient2) {
        return Email.builder()
                .id(UUID.randomUUID())
                .requestId(UUID.randomUUID())
                .recipient1("a@x.com")
                .recipient2(recipient2)
                .templateId(UUID.randomUUID())
                .templateValues(Map.of())
                .status(status)
                .build();
    }

    @Test
    void progressAggregatesCountsAndMergesRecipients() {
        final UUID requestId = UUID.randomUUID();
        when(emailRepo.countByStatus(requestId))
                .thenReturn(Map.of(EmailStatus.SENT, 2, EmailStatus.ERROR, 1, EmailStatus.PENDING, 1));
        when(emailRepo.findByRequest(requestId)).thenReturn(List.of(row(EmailStatus.SENT, "b@x.com")));

        final EmailProgressResponse response = service.progress(requestId);

        assertEquals(4, response.total());
        assertEquals(2, response.sent());
        assertEquals(1, response.error());
        assertEquals(1, response.pending());
        assertEquals(0, response.processing());
        assertEquals(List.of("a@x.com", "b@x.com"), response.emails().get(0).recipients());
    }

    @Test
    void historyMarksSessionTerminalWhenNothingInFlight() {
        when(requestRepo.listWithCounts())
                .thenReturn(List.of(
                        new EmailRequestCounts(
                                UUID.randomUUID(), EmailSource.MANUAL, UUID.randomUUID(), Instant.now(), 3, 3, 0, 0),
                        new EmailRequestCounts(
                                UUID.randomUUID(),
                                EmailSource.MATCHING,
                                UUID.randomUUID(),
                                Instant.now(),
                                5,
                                2,
                                0,
                                3)));

        final List<EmailRequestSummary> history = service.history();

        assertTrue(history.get(0).terminal());
        assertEquals(false, history.get(1).terminal());
    }

    @Test
    void resendFlipsErrorRowAndTriggersDrain() {
        final UUID id = UUID.randomUUID();
        when(emailRepo.markPendingIfError(id)).thenReturn(1);

        service.resend(id);

        verify(drainer).trigger();
    }

    @Test
    void resendUnknownRowIs404() {
        final UUID id = UUID.randomUUID();
        when(emailRepo.markPendingIfError(id)).thenReturn(0);
        when(emailRepo.findById(id)).thenReturn(Optional.empty());

        assertThrows(EmailNotFoundException.class, () -> service.resend(id));
        verify(drainer, never()).trigger();
    }

    @Test
    void resendNonErrorRowIs409() {
        final UUID id = UUID.randomUUID();
        when(emailRepo.markPendingIfError(id)).thenReturn(0);
        when(emailRepo.findById(id)).thenReturn(Optional.of(row(EmailStatus.SENT, null)));

        assertThrows(EmailNotResendableException.class, () -> service.resend(id));
        verify(drainer, never()).trigger();
    }
}
