package org.patinanetwork.patchats.email.db.repos;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.patinanetwork.patchats.email.db.models.Email;
import org.patinanetwork.patchats.email.db.models.EmailStatus;

/** Access to the {@code emails} outbox: enqueue children, claim a batch, update per-row status, boot recovery. */
public interface EmailRepo {

    /** Batch-inserts the outbox children (one transaction with the parent, see {@code EmailEnqueueService}). */
    void insertAll(List<Email> emails);

    /**
     * Atomically claims up to {@code limit} of the oldest {@code PENDING} rows, flipping them to {@code PROCESSING},
     * and returns them. Single-instance deployment means no row-locking is required (decision #5).
     */
    List<Email> claimBatch(int limit);

    /** Marks a row {@code SENT} with {@code sent_at = now()}. */
    void markSent(UUID id);

    /** Marks a row {@code ERROR} with the given message (no retry — terminal, decision #8). */
    void markError(UUID id, String errorMessage);

    /**
     * At-most-once crash recovery (decision #9): flips any orphaned {@code PROCESSING} rows to {@code ERROR}. Returns
     * the number of rows reset.
     */
    int resetProcessingToError();

    /** Per-status row counts for one batch ({@code GROUP BY status}); statuses with no rows are absent. */
    Map<EmailStatus, Integer> countByStatus(UUID requestId);

    /** All rows of one batch, oldest first, for the per-email progress table. */
    List<Email> findByRequest(UUID requestId);

    Optional<Email> findById(UUID id);

    /**
     * Flips a row {@code ERROR → PENDING} and clears its error message, but only if it is currently {@code ERROR}.
     * Returns the number of rows changed (1 on success, 0 if the row was not in {@code ERROR}).
     */
    int markPendingIfError(UUID id);
}
