package org.patinanetwork.patchats.email.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Request to render a stored template against caller-supplied messages without sending. Mirrors the async send input so
 * the preview shows exactly what the runner would render (decision #4).
 */
public record PreviewTemplateRequest(
        @NotNull UUID templateId, @NotEmpty @Valid java.util.List<EnqueueEmailRequest.Message> messages) {}
