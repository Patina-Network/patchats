package org.patinanetwork.patchats.email.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request to enqueue an async send. Unlike the sync {@link SendEmailRequest}, the subject/body are not supplied inline
 * — they come from the referenced {@code templateId}, which the runner renders per row at send-time (decision #4, #16).
 */
public record EnqueueEmailRequest(
        @NotNull UUID templateId,
        @Email String replyTo,
        @NotEmpty @Valid List<Message> messages) {

    /** One outgoing email addressed to 1–2 recipients who share the rendered body. */
    public record Message(
            Map<String, String> variables,
            @NotEmpty @Size(max = 2) @Valid List<SendEmailRequest.Recipient> recipients) {}
}
