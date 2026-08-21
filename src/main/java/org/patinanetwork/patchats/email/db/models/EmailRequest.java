package org.patinanetwork.patchats.email.db.models;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/** One "sending session" — the parent of N {@link Email} rows and the unit of the history tab. */
@Getter
@Builder
@ToString
@EqualsAndHashCode
public class EmailRequest {

    private UUID id;

    private String label;

    private String senderEmail;

    private EmailSource source;

    private UUID templateId;

    private int totalCount;

    private Instant createdAt;
}
