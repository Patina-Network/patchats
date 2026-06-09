package org.patinanetwork.patchats.email.dto;

import java.util.List;

/** Result of a send request: totals plus a per-message outcome, in request order. */
public record SendEmailResponse(int sent, int failed, List<MessageResult> results) {

    /** Outcome for a single message (the email to its 1–2 recipients). */
    public record MessageResult(List<String> recipients, boolean sent, String error) {}
}
