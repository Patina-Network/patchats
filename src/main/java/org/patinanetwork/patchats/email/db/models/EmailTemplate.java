package org.patinanetwork.patchats.email.db.models;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/** A reusable {@code ${}} subject/body template. Immutable once created (see decision #15). */
@Getter
@Builder
@ToString
@EqualsAndHashCode
public class EmailTemplate {

    private UUID id;

    private String name;

    private String subject;

    private String body;

    private Instant createdAt;

    private Instant updatedAt;
}
