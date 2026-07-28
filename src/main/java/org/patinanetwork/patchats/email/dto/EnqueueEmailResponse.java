package org.patinanetwork.patchats.email.dto;

import java.util.UUID;

/** Result of a successful enqueue: the parent session id to poll for progress, and how many rows were accepted. */
public record EnqueueEmailResponse(UUID requestId, int accepted) {}
