package org.patinanetwork.patchats.email.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Live state of one batch: per-status counts plus the per-email rows. Powers the polled progress view. */
public record EmailProgressResponse(
        int total, int pending, int processing, int sent, int error, List<EmailSummary> emails) {

    /** One outbox row as shown in the progress table; {@code recipients} merges the two recipient columns. */
    public record EmailSummary(UUID id, List<String> recipients, String status, String error, Instant sentAt) {}
}
