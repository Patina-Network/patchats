package org.patinanetwork.patchats.email;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.common.web.exception.EmailNotFoundException;
import org.patinanetwork.patchats.common.web.exception.EmailNotResendableException;
import org.patinanetwork.patchats.email.db.models.Email;
import org.patinanetwork.patchats.email.db.models.EmailStatus;
import org.patinanetwork.patchats.email.db.repos.EmailRepo;
import org.patinanetwork.patchats.email.db.repos.EmailRequestRepo;
import org.patinanetwork.patchats.email.dto.EmailProgressResponse;
import org.patinanetwork.patchats.email.dto.EmailRequestSummary;
import org.springframework.stereotype.Service;

/** Read/UX-support layer over the pipeline: batch progress, session history, and manual resend of failed rows. */
@Service
@RequiredArgsConstructor
public class EmailProgressService {

    private final EmailRepo emailRepo;
    private final EmailRequestRepo requestRepo;
    private final EmailDrainer drainer;

    /** Live per-status counts + the per-email rows for one batch. */
    public EmailProgressResponse progress(final UUID requestId) {
        final Map<EmailStatus, Integer> counts = emailRepo.countByStatus(requestId);
        final List<Email> rows = emailRepo.findByRequest(requestId);

        final List<EmailProgressResponse.EmailSummary> summaries = new ArrayList<>(rows.size());
        for (final Email email : rows) {
            final List<String> recipients = email.getRecipient2() == null
                    ? List.of(email.getRecipient1())
                    : List.of(email.getRecipient1(), email.getRecipient2());
            summaries.add(new EmailProgressResponse.EmailSummary(
                    email.getId(), recipients, email.getStatus().name(), email.getErrorMessage(), email.getSentAt()));
        }

        final int pending = counts.getOrDefault(EmailStatus.PENDING, 0);
        final int processing = counts.getOrDefault(EmailStatus.PROCESSING, 0);
        final int sent = counts.getOrDefault(EmailStatus.SENT, 0);
        final int error = counts.getOrDefault(EmailStatus.ERROR, 0);
        return new EmailProgressResponse(
                pending + processing + sent + error, pending, processing, sent, error, summaries);
    }

    /** History of past sending sessions, newest first, each flagged {@code terminal} when nothing is in flight. */
    public List<EmailRequestSummary> history() {
        return requestRepo.listWithCounts().stream()
                .map(EmailRequestSummary::from)
                .toList();
    }

    /**
     * Manual recovery required by the at-most-once model (decision #9): flips an {@code ERROR} row back to
     * {@code PENDING} and kicks the drain. 404 if the row is unknown, 409 if it is not currently {@code ERROR}.
     */
    public void resend(final UUID emailId) {
        final int updated = emailRepo.markPendingIfError(emailId);
        if (updated == 0) {
            emailRepo.findById(emailId).orElseThrow(() -> new EmailNotFoundException(emailId));
            throw new EmailNotResendableException(emailId);
        }
        drainer.trigger();
    }
}
