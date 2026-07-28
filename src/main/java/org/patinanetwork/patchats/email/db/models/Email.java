package org.patinanetwork.patchats.email.db.models;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * One row of the {@code emails} outbox — a single message addressed to 1–2 recipients. The runner renders
 * {@code subject}/{@code body} from {@link #templateId} + {@link #templateValues} at send-time; rendered text is never
 * stored (decision #4).
 */
@Getter
@Builder
@ToString
@EqualsAndHashCode
public class Email {

    private UUID id;

    private UUID requestId;

    private UUID matchesId;

    private String recipient1;

    private String recipient2;

    private String replyTo;

    private UUID templateId;

    private Map<String, String> templateValues;

    @Setter
    private EmailStatus status;

    @Setter
    private String errorMessage;

    private Instant createdAt;

    private Instant updatedAt;

    @Setter
    private Instant sentAt;
}
