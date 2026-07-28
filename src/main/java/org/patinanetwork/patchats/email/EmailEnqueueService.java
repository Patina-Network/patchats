package org.patinanetwork.patchats.email;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.patinanetwork.patchats.email.dto.PreviewEmailResponse;
import org.patinanetwork.patchats.email.dto.PreviewTemplateRequest;
import org.patinanetwork.patchats.email.dto.SendEmailRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Producer side of the async pipeline: validates the template, merges each message's variables, and enqueues one parent
 * {@code email_requests} session plus N {@code emails} outbox rows in a single transaction. It never renders or sends —
 * rendering happens later in the {@link EmailDrainer} at send-time (decision #4). The service does not start the
 * runner; the caller kicks the drain via {@code POST /api/email/process} after the enqueue transaction commits
 * (decision #6).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailEnqueueService {

    private final EmailTemplateRepo templateRepo;
    private final EmailRequestRepo requestRepo;
    private final EmailRepo emailRepo;
    private final EmailRenderer renderer;

    /** Enqueues a batch. {@code source} distinguishes the producer (MANUAL vs MATCHING). */
    @Transactional
    public EnqueueEmailResponse enqueue(final EnqueueEmailRequest request, final EmailSource source) {
        final EmailTemplate template = templateRepo
                .findById(request.templateId())
                .orElseThrow(() -> new EmailTemplateNotFoundException(request.templateId()));

        final UUID requestId = UUID.randomUUID();
        requestRepo.insert(EmailRequest.builder()
                .id(requestId)
                .source(source)
                .templateId(template.getId())
                .totalCount(request.messages().size())
                .build());

        final List<Email> emails = new ArrayList<>(request.messages().size());
        for (final EnqueueEmailRequest.Message message : request.messages()) {
            final Map<String, String> variables =
                    EmailService.mergeVariables(message.variables(), message.recipients());
            final List<SendEmailRequest.Recipient> recipients = message.recipients();
            emails.add(Email.builder()
                    .id(UUID.randomUUID())
                    .requestId(requestId)
                    .matchesId(message.matchesId())
                    .recipient1(recipients.get(0).email())
                    .recipient2(recipients.size() > 1 ? recipients.get(1).email() : null)
                    .replyTo(request.replyTo())
                    .templateId(template.getId())
                    .templateValues(variables)
                    .status(EmailStatus.PENDING)
                    .build());
        }
        emailRepo.insertAll(emails);
        log.info("Enqueued request {} ({} emails, source={})", requestId, emails.size(), source);
        return new EnqueueEmailResponse(requestId, emails.size());
    }

    /**
     * Renders the referenced template against each message without sending or persisting. Best-effort: a per-message
     * render failure is reported in that message's {@code error} (mirrors the sync preview model).
     */
    public PreviewEmailResponse preview(final PreviewTemplateRequest request) {
        final EmailTemplate template = templateRepo
                .findById(request.templateId())
                .orElseThrow(() -> new EmailTemplateNotFoundException(request.templateId()));

        final List<PreviewEmailResponse.MessagePreview> previews = new ArrayList<>();
        for (final EnqueueEmailRequest.Message message : request.messages()) {
            final List<String> recipients = message.recipients().stream()
                    .map(SendEmailRequest.Recipient::email)
                    .toList();
            try {
                final Map<String, String> variables =
                        EmailService.mergeVariables(message.variables(), message.recipients());
                final EmailRenderer.RenderedEmail rendered = renderer.render(template, variables);
                previews.add(
                        new PreviewEmailResponse.MessagePreview(recipients, rendered.subject(), rendered.body(), null));
            } catch (final RuntimeException ex) {
                previews.add(new PreviewEmailResponse.MessagePreview(recipients, null, null, ex.getMessage()));
            }
        }
        return new PreviewEmailResponse(previews);
    }
}
