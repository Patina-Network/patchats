package org.patinanetwork.patchats.email;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final TemplateRenderer renderer;
    private final EmailSender sender;

    public SendEmailResponse send(final SendEmailRequest request) {
        final Optional<String> replyTo = Optional.ofNullable(request.replyTo()).filter(StringUtils::hasText);
        final List<SendEmailResponse.MessageResult> results = new ArrayList<>();
        int sent = 0;
        int failed = 0;

        for (final SendEmailRequest.Message message : request.messages()) {
            final List<String> recipients = message.recipients().stream()
                    .map(SendEmailRequest.Recipient::email)
                    .toList();
            try {
                final Map<String, String> variables = mergeVariables(message);
                final String subject = renderer.render(request.subject(), variables);
                final String body = renderer.render(request.body(), variables);
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

        return new SendEmailResponse(sent, failed, results);
    }

    /**
     * Flattens a message's variables into one map: message-level variables un-prefixed, and each recipient's variables
     * under a positional {@code recipient1.}/{@code recipient2.} prefix.
     */
    private static Map<String, String> mergeVariables(final SendEmailRequest.Message message) {
        final Map<String, String> merged = new HashMap<>();
        if (message.variables() != null) {
            merged.putAll(message.variables());
        }
        final List<SendEmailRequest.Recipient> recipients = message.recipients();
        for (int i = 0; i < recipients.size(); i++) {
            final String prefix = "recipient" + (i + 1) + ".";
            final Map<String, String> vars = recipients.get(i).variableToValue();
            if (vars != null) {
                vars.forEach((key, value) -> merged.put(prefix + key, value));
            }
        }
        return merged;
    }
}
