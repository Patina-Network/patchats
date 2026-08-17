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

    @Setter
    private UUID memberAId;

    @Setter
    private UUID memberBId;

    @Setter
    private Integer matchCycleId;

    @Setter
    private Double matchScore;

    @Setter
    private String status;

    private Instant createdAt;
}
