package org.patinanetwork.patchats.email.db.repos;

import java.util.List;
import org.patinanetwork.patchats.email.db.models.EmailRequest;
import org.patinanetwork.patchats.email.db.models.EmailRequestCounts;

/** Writes the parent {@code email_requests} session row and reads the history list with aggregated child counts. */
public interface EmailRequestRepo {

    /** Inserts the session row and returns it as persisted (with DB-populated {@code created_at}). */
    EmailRequest insert(EmailRequest request);

    /** History list for the sessions tab: one entry per session with child counts, newest first. */
    List<EmailRequestCounts> listWithCounts();
}
