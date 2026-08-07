package org.patinanetwork.patchats.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.common.web.exception.EmailTemplateNotFoundException;
import org.patinanetwork.patchats.email.db.models.Email;
import org.patinanetwork.patchats.email.db.models.EmailRequest;
import org.patinanetwork.patchats.email.db.models.EmailSource;
import org.patinanetwork.patchats.email.db.models.EmailStatus;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;
import org.patinanetwork.patchats.email.db.repos.EmailRepo;
import org.patinanetwork.patchats.email.db.repos.EmailRequestRepo;
import org.patinanetwork.patchats.email.db.repos.EmailTemplateRepo;
import org.patinanetwork.patchats.email.dto.EnqueueEmailRequest;
import org.patinanetwork.patchats.email.dto.EnqueueEmailResponse;
import org.patinanetwork.patchats.email.dto.SendEmailRequest;

class EmailEnqueueServiceTest {

    private final EmailTemplateRepo templateRepo = mock(EmailTemplateRepo.class);
    private final EmailRequestRepo requestRepo = mock(EmailRequestRepo.class);
    private final EmailRepo emailRepo = mock(EmailRepo.class);
    private final EmailEnqueueService service =
            new EmailEnqueueService(templateRepo, requestRepo, emailRepo, new EmailRenderer(new TemplateRenderer()));

    private static final UUID TEMPLATE_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private EmailTemplate seededTemplate() {
        return EmailTemplate.builder()
                .id(TEMPLATE_ID)
                .name("Welcome")
                .subject("Hi ${per1.name}")
                .body("Body for ${per1.name}")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<Email> captureInsertedEmails() {
        final ArgumentCaptor<List<Email>> captor = ArgumentCaptor.forClass(List.class);
        verify(emailRepo).insertAll(captor.capture());
        return captor.getValue();
    }

    @Test
    void enqueueStoresTemplateRefAndValuesWithoutRendering() {
        when(templateRepo.findById(TEMPLATE_ID)).thenReturn(Optional.of(seededTemplate()));

        final EnqueueEmailRequest request = new EnqueueEmailRequest(
                TEMPLATE_ID,
                "reply@x.com",
                List.of(new EnqueueEmailRequest.Message(
                        Map.of("period", "July"),
                        List.of(new SendEmailRequest.Recipient("ann@x.com", Map.of("name", "Ann"))))));

        final EnqueueEmailResponse response = service.enqueue(request, EmailSource.MANUAL);

        assertEquals(1, response.accepted());
        final List<Email> inserted = captureInsertedEmails();
        assertEquals(1, inserted.size());
        final Email email = inserted.get(0);
        assertEquals(EmailStatus.PENDING, email.getStatus());
        assertEquals(TEMPLATE_ID, email.getTemplateId());
        assertEquals("ann@x.com", email.getRecipient1());
        assertNull(email.getRecipient2());
        // Stores the merged variables, not any rendered subject/body.
        assertEquals("Ann", email.getTemplateValues().get("per1.name"));
        assertEquals("July", email.getTemplateValues().get("period"));
    }

    @Test
    void enqueueInsertsOneParentAndNChildren() {
        when(templateRepo.findById(TEMPLATE_ID)).thenReturn(Optional.of(seededTemplate()));

        final EnqueueEmailRequest request = new EnqueueEmailRequest(
                TEMPLATE_ID,
                null,
                List.of(
                        new EnqueueEmailRequest.Message(
                                Map.of(), List.of(new SendEmailRequest.Recipient("a@x.com", Map.of()))),
                        new EnqueueEmailRequest.Message(
                                Map.of(), List.of(new SendEmailRequest.Recipient("b@x.com", Map.of())))));

        service.enqueue(request, EmailSource.MANUAL);

        final ArgumentCaptor<EmailRequest> parent = ArgumentCaptor.forClass(EmailRequest.class);
        verify(requestRepo).insert(parent.capture());
        assertEquals(2, parent.getValue().getTotalCount());
        assertEquals(EmailSource.MANUAL, parent.getValue().getSource());
        assertEquals(2, captureInsertedEmails().size());
    }

    @Test
    void unknownTemplateThrows() {
        final UUID missing = UUID.randomUUID();
        when(templateRepo.findById(missing)).thenReturn(Optional.empty());

        final EnqueueEmailRequest request = new EnqueueEmailRequest(
                missing,
                null,
                List.of(new EnqueueEmailRequest.Message(
                        Map.of(), List.of(new SendEmailRequest.Recipient("a@x.com", Map.of())))));

        assertThrows(EmailTemplateNotFoundException.class, () -> service.enqueue(request, EmailSource.MANUAL));
        verify(emailRepo, org.mockito.Mockito.never()).insertAll(any());
    }
}
