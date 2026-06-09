package org.patinanetwork.patchats.email.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

/**
 * Request to send one or more templated plain-text emails. {@code subject} and {@code body} are templates shared across
 * all messages; each message supplies the variables to merge in.
 */
public record SendEmailRequest(
        @NotBlank String subject,
        @NotBlank String body,
        @Email String replyTo,
        @NotEmpty @Valid List<Message> messages) {

    /** One outgoing email addressed to 1–2 recipients who share the rendered body. */
    public record Message(
            Map<String, String> variables,
            @NotEmpty @Size(max = 2) @Valid List<Recipient> recipients) {}

    /** A single recipient and the variables personalised to them (exposed as {@code recipientN.*}). */
    public record Recipient(@NotBlank @Email String email, Map<String, String> name_to_variable) {}
}
