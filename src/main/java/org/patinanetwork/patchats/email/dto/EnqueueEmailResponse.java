package org.patinanetwork.patchats.email.dto;

import java.util.UUID;

/**
 * Result of an enqueue: the parent session id to poll for progress, and how many rows were accepted. {@code requestId}
 * is {@code null} when nothing was enqueued (e.g. every matching pair was filtered by the dedup guard), in which case
 * {@code accepted} is 0 and there is no session to poll.
 */
public record EnqueueEmailResponse(UUID requestId, int accepted) {}
