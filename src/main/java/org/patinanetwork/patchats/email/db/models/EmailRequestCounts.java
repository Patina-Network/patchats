package org.patinanetwork.patchats.email.db.models;

import java.time.Instant;
import java.util.UUID;

/**
 * A session row joined with aggregated child counts — the history-list unit (Increment 2). {@code inFlight} counts rows
 * still {@code PENDING}/{@code PROCESSING}; a session is terminal when it is zero.
 */
public record EmailRequestCounts(
        UUID id,
        EmailSource source,
        UUID templateId,
        Instant createdAt,
        int totalCount,
        int sent,
        int error,
        int inFlight) {}
