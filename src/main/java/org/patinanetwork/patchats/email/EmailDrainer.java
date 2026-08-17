package org.patinanetwork.patchats.email;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.slf4j.Slf4j;
import org.patinanetwork.patchats.email.db.models.Email;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;
import org.patinanetwork.patchats.email.db.repos.EmailRepo;
import org.patinanetwork.patchats.email.db.repos.EmailTemplateRepo;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * On-demand background runner (decision #6). Drains the {@code emails} outbox: claims a small batch, renders each row
 * from its template, sends over SMTP, and records a terminal status — one attempt, no retry (decision #8).
 *
 * <p>Started only by an explicit kick ({@link #trigger()}, from {@code POST /api/email/process}) or the startup drain;
 * there is no enqueue-time auto-trigger and no polling. Runs single-threaded so overlapping triggers coalesce.
 */
@Component
@Slf4j
@Profile("!ci")
public class EmailDrainer {

    private static final int BATCH_SIZE = 50;

    private final EmailRepo emailRepo;
    private final EmailTemplateRepo templateRepo;
    private final EmailRenderer renderer;
    private final EmailSender sender;
    private final Executor executor;

    /** True while a drain job is running; guards against launching a second overlapping drain. */
    private final AtomicBoolean running = new AtomicBoolean(false);
    /** Set by a trigger that arrives during a drain, so the running drain loops once more instead of exiting. */
    private final AtomicBoolean rerun = new AtomicBoolean(false);

    public EmailDrainer(
            final EmailRepo emailRepo,
            final EmailTemplateRepo templateRepo,
            final EmailRenderer renderer,
            final EmailSender sender,
            @Qualifier("emailDrainExecutor") final Executor executor) {
        this.emailRepo = emailRepo;
        this.templateRepo = templateRepo;
        this.renderer = renderer;
        this.sender = sender;
        this.executor = executor;
    }

    /**
     * Requests a drain. If one is already running, flags it to loop again; otherwise submits a fresh drain job. Returns
     * immediately — the drain runs on the executor thread.
     */
    public void trigger() {
        rerun.set(true);
        if (running.compareAndSet(false, true)) {
            executor.execute(this::drainLoop);
        }
    }

    private void drainLoop() {
        try {
            do {
                rerun.set(false);
                drainAll();
            } while (rerun.get());
        } finally {
            running.set(false);
        }
        // A trigger racing between the last rerun check and clearing `running` must not be lost.
        if (rerun.get() && running.compareAndSet(false, true)) {
            executor.execute(this::drainLoop);
        }
    }

    private void drainAll() {
        // Cache templates for the life of one drain so a batch of the same template loads it once.
        final Map<UUID, EmailTemplate> templateCache = new HashMap<>();
        List<Email> batch = emailRepo.claimBatch(BATCH_SIZE);
        while (!batch.isEmpty()) {
            for (final Email email : batch) {
                sendOne(email, templateCache);
            }
            batch = emailRepo.claimBatch(BATCH_SIZE);
        }
    }

    private void sendOne(final Email email, final Map<UUID, EmailTemplate> templateCache) {
        try {
            final EmailTemplate template = templateCache.computeIfAbsent(email.getTemplateId(), id -> templateRepo
                    .findById(id)
                    .orElseThrow(() -> new IllegalStateException("Template " + id + " no longer exists")));
            final EmailRenderer.RenderedEmail rendered = renderer.render(template, email.getTemplateValues());
            final List<String> recipients = email.getRecipient2() == null
                    ? List.of(email.getRecipient1())
                    : List.of(email.getRecipient1(), email.getRecipient2());
            sender.send(new OutgoingEmail(
                    recipients, rendered.subject(), rendered.body(), Optional.ofNullable(email.getReplyTo())));
            emailRepo.markSent(email.getId());
            log.info("Sent email {} to {}", email.getId(), recipients);
        } catch (final RuntimeException ex) {
            // Any failure — SMTP or a render error (missing variable / malformed template) — is terminal (no retry).
            log.warn("Email {} failed: {}", email.getId(), ex.getMessage());
            emailRepo.markError(email.getId(), ex.getMessage());
        }
    }
}
