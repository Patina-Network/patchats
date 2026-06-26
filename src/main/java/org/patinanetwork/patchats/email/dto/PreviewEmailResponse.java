package org.patinanetwork.patchats.email.dto;

import java.util.List;

/** Rendered preview of a send request: each message's rendered subject/body, in request order. Nothing is sent. */
public record PreviewEmailResponse(List<MessagePreview> previews) {

    /**
     * Rendered preview for a single message. {@code subject}/{@code body} hold the rendered text when rendering
     * succeeds; on failure they are null and {@code error} explains why (mirrors the best-effort send model).
     */
    public record MessagePreview(List<String> recipients, String subject, String body, String error) {}
}
