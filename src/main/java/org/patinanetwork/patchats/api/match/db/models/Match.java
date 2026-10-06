package org.patinanetwork.patchats.api.match.db.models;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Builder
@ToString
@EqualsAndHashCode(of = "id")
public class Match {

    private UUID id;

    public enum MatchStatus {
        PENDING,
        CONFIRMED,
        COMPLETED,
        CANCELLED,
        SKIPPED
    }

    @Setter
    private UUID memberAId;

    @Setter
    private UUID memberBId;

    @Setter
    private Integer matchCycleId;

    @Setter
    private Double matchScore;

    @Setter
    private MatchStatus status;

    private Instant createdAt;

    private String period;

    private String memberAFirstName;

    private String memberALastName;

    private String memberBFirstName;

    private String memberBLastName;
}
