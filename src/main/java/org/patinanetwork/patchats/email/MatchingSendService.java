package org.patinanetwork.patchats.email;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.patinanetwork.patchats.email.db.models.EmailSource;
import org.patinanetwork.patchats.email.db.repos.EmailRepo;
import org.patinanetwork.patchats.email.dto.EnqueueEmailRequest;
import org.patinanetwork.patchats.email.dto.EnqueueEmailResponse;
import org.patinanetwork.patchats.email.dto.MatchingSendRequest;
import org.patinanetwork.patchats.email.dto.SendEmailRequest.Recipient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transforms pairing selection (from the matching flow) into enqueued messages. Applies the dedup guard: before
 * enqueuing a pair with a {@code matchesId}, checks if it has already been sent (a non-{@code ERROR} row exists). The
 * service then delegates to {@link EmailEnqueueService} with {@code source=MATCHING}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingSendService {

    private final EmailEnqueueService enqueueService;
    private final EmailRepo emailRepo;

    /**
     * Accept selected pairs, validate & fan them into messages, apply dedup, and enqueue with {@code source=MATCHING}.
     */
    @Transactional
    public EnqueueEmailResponse send(final MatchingSendRequest request) {
        final List<EnqueueEmailRequest.Message> messages = new ArrayList<>();

        for (final MatchingSendRequest.Pair pair : request.pairs()) {
            // Dedup guard: if this pair has a matchesId and already has a non-ERROR row, skip it
            if (pair.matchesId() != null) {
                final long existingCount = emailRepo.countActiveByMatchesId(pair.matchesId());
                if (existingCount > 0) {
                    log.warn(
                            "Skipping pair {} — dedup guard: {} non-ERROR row(s) already exist",
                            pair.matchesId(),
                            existingCount);
                    continue;
                }
            }

            // Build variables map: per1.*, per2.*, shared vars
            final Map<String, String> variables = new HashMap<>();

            // Add shared variables (e.g., ${period}, ${year}, etc.)
            if (request.sharedVariables() != null) {
                variables.putAll(request.sharedVariables());
            }

            // Add per1.* variables
            if (pair.per1() != null) {
                variables.put("per1.name", pair.per1().name());
                variables.put("per1.email", pair.per1().email());
                variables.put("per1.bio", pair.per1().bio());
                variables.put("per1.industry", pair.per1().industry());
                variables.put("per1.role", pair.per1().role());
                variables.put("per1.topics", pair.per1().topics());
                variables.put("per1.linkedUrl", pair.per1().linkedUrl());
            }

            // Add per2.* variables
            if (pair.per2() != null) {
                variables.put("per2.name", pair.per2().name());
                variables.put("per2.email", pair.per2().email());
                variables.put("per2.bio", pair.per2().bio());
                variables.put("per2.industry", pair.per2().industry());
                variables.put("per2.role", pair.per2().role());
                variables.put("per2.topics", pair.per2().topics());
                variables.put("per2.linkedUrl", pair.per2().linkedUrl());
            }

            // Create message with both recipients
            final List<Recipient> recipients = List.of(
                    new Recipient(pair.per1().email(), new HashMap<>()), // Recipients carry no extra vars
                    new Recipient(pair.per2().email(), new HashMap<>()));

            messages.add(new EnqueueEmailRequest.Message(pair.matchesId(), variables, recipients));
        }

        // Enqueue all messages with source=MATCHING. If the dedup guard filtered every pair, there is nothing to
        // enqueue: return a null requestId (no session was created) rather than a phantom one the caller can't poll.
        if (messages.isEmpty()) {
            log.info("No messages to enqueue — all selected pairs were already sent");
            return new EnqueueEmailResponse(null, 0);
        }

        final EnqueueEmailRequest enqueueRequest =
                new EnqueueEmailRequest(request.templateId(), request.replyTo(), messages);
        return enqueueService.enqueue(enqueueRequest, EmailSource.MATCHING);
    }
}
