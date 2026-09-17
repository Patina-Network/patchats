package org.patinanetwork.patchats.email;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
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
import org.patinanetwork.patchats.email.dto.PreviewEmailResponse;
import org.patinanetwork.patchats.email.dto.SendEmailRequest;
import org.patinanetwork.patchats.email.dto.SendEmailResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Renders the caller-supplied templates once per message and delivers each via the configured {@link EmailSender}.
 * Best-effort: a render or delivery failure fails only that message and is reported in the result; the rest of the
 * batch still goes out.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final EmailTemplateRepo templateRepo;
    private final EmailRequestRepo requestRepo;
    private final EmailRepo emailRepo;
    private final TemplateRenderer templateRenderer;
    private final EmailSender sender;

    public SendEmailResponse send(final SendEmailRequest request) {
        final EmailTemplate template = templateRepo
                .findById(request.templateId())
                .orElseThrow(() -> new EmailTemplateNotFoundException(request.templateId()));

        final Optional<String> replyTo = Optional.ofNullable(request.replyTo()).filter(StringUtils::hasText);
        final List<SendEmailResponse.MessageResult> results = new ArrayList<>();
        int sent = 0;
        int failed = 0;

        // Fill in the send-time month once for the whole batch so ${month} resolves consistently.
        final String currentMonth =
                LocalDate.now(ZoneId.of("America/New_York")).getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        for (final SendEmailRequest.Message message : request.messages()) {
            final List<String> recipients = message.recipients().stream()
                    .map(SendEmailRequest.Recipient::email)
                    .toList();
            try {
                final Map<String, String> variables = mergeVariables(message.variables(), message.recipients());
                variables.putIfAbsent("month", currentMonth);
                final String subject = templateRenderer.render(request.subject(), variables);
                final String body = templateRenderer.render(request.body(), variables);
                sender.send(new OutgoingEmail(recipients, subject, body, replyTo));
                log.info("Sent email to {}", recipients);
                results.add(new SendEmailResponse.MessageResult(recipients, true, null));
                sent++;
            } catch (final RuntimeException ex) {
                log.warn("Failed to send email to {}: {}", recipients, ex.getMessage());
                results.add(new SendEmailResponse.MessageResult(recipients, false, ex.getMessage()));
                failed++;
            }
        }
        try {
            final UUID requestId = UUID.randomUUID();
            requestRepo.insert(EmailRequest.builder()
                    .id(requestId)
                    .source(EmailSource.SYNCHRONOUS)
                    .templateId(template.getId())
                    .totalCount(request.messages().size())
                    .build());

            // Build email records with the same month variable used in sending
            final List<Email> emails = new ArrayList<>(request.messages().size());
            for (int i = 0; i < request.messages().size(); i++) {
                final SendEmailRequest.Message message = request.messages().get(i);
                final Map<String, String> variables =
                        EmailService.mergeVariables(message.variables(), message.recipients());
                variables.putIfAbsent("month", currentMonth);
                final List<SendEmailRequest.Recipient> recipients = message.recipients();
                final SendEmailResponse.MessageResult result = results.get(i);
                emails.add(Email.builder()
                        .id(UUID.randomUUID())
                        .requestId(requestId)
                        .recipient1(recipients.get(0).email())
                        .recipient2(recipients.size() > 1 ? recipients.get(1).email() : null)
                        .replyTo(request.replyTo())
                        .templateId(template.getId())
                        .templateValues(variables)
                        .status(result.sent() ? EmailStatus.SENT : EmailStatus.ERROR)
                        .errorMessage(result.error())
                        .build());
            }
            emailRepo.insertAll(emails);
        } catch (Exception ex) {
            log.error("Failed to insert emails: {}", ex.getMessage());
        }
        return new SendEmailResponse(sent, failed, results);
    }

    /**
     * Renders each message and returns the result without sending. Best-effort: a render failure is reported per
     * message.
     */
    public PreviewEmailResponse preview(final SendEmailRequest request) {
        final List<PreviewEmailResponse.MessagePreview> previews = new ArrayList<>();
        for (final SendEmailRequest.Message message : request.messages()) {
            final List<String> recipients = message.recipients().stream()
                    .map(SendEmailRequest.Recipient::email)
                    .toList();
            try {
                final Map<String, String> variables = mergeVariables(message.variables(), message.recipients());
                final String subject = templateRenderer.render(request.subject(), variables);
                final String body = templateRenderer.render(request.body(), variables);
                previews.add(new PreviewEmailResponse.MessagePreview(recipients, subject, body, null));
            } catch (final RuntimeException ex) {
                previews.add(new PreviewEmailResponse.MessagePreview(recipients, null, null, ex.getMessage()));
            }
        }
        return new PreviewEmailResponse(previews);
    }

    /**
     * Flattens a message's variables into one map: message-level variables un-prefixed, and each recipient's variables
     * under a positional {@code per1.}/{@code per2.} prefix. Shared by the sync send/preview paths and the async
     * enqueue pipeline so the stored {@code template_values} match exactly what a preview renders.
     */
    public static Map<String, String> mergeVariables(
            final Map<String, String> messageVariables, final List<SendEmailRequest.Recipient> recipients) {
        final Map<String, String> merged = new HashMap<>();
        if (messageVariables != null) {
            merged.putAll(messageVariables);
        }
        for (int i = 0; i < recipients.size(); i++) {
            final String prefix = "per" + (i + 1) + ".";
            final Map<String, String> vars = recipients.get(i).variableToValue();
            if (vars != null) {
                vars.forEach((key, value) -> merged.put(prefix + key, value));

                // manually add per#.name
                final String firstName = vars.get("firstName");
                final String lastName = vars.get("lastName");
                if (firstName != null && lastName != null) {
                    merged.put(prefix + "name", firstName + " " + lastName);
                } else if (firstName != null) {
                    merged.put(prefix + "name", firstName);
                } else if (lastName != null) {
                    merged.put(prefix + "name", lastName);
                }
            }
        }
        return merged;
    }
}
