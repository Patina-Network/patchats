package org.patinanetwork.patchats.api.matches.db.models;

import java.time.Instant;
import java.util.List;
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
public class MatchCycle {

    private UUID id;

    @Setter
    private String period;

    @Setter
    private Instant runAt;

    @Setter
    private Integer totalMembers;

    @Setter
    private Integer totalMatched;

    @Setter
    private List<UUID> unmatchedIds;
}
