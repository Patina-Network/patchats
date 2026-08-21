package org.patinanetwork.patchats.email.dto;

import java.time.Instant;
import java.util.UUID;
import org.patinanetwork.patchats.email.db.models.EmailRequestCounts;

/** History-list entry for a past sending session. {@code terminal} is true once nothing is still in flight. */
public record EmailRequestSummary(
        UUID id,
        String source,
        UUID templateId,
        Instant createdAt,
        int total,
        int sent,
        int error,
        int inFlight,
        boolean terminal) {

    public static EmailRequestSummary from(final EmailRequestCounts counts) {
        return new EmailRequestSummary(
                counts.id(),
                counts.source().name(),
                counts.templateId(),
                counts.createdAt(),
                counts.totalCount(),
                counts.sent(),
                counts.error(),
                counts.inFlight(),
                counts.inFlight() == 0);
    }
}
