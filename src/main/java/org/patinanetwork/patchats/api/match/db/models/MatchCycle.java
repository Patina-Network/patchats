package org.patinanetwork.patchats.api.match.db.models;

import java.time.Instant;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@ToString
@Builder
@EqualsAndHashCode(of = "id")
public class MatchCycle {
    private Integer id;

    @Setter
    private String period;

    @Setter
    private Instant runAt;

    @Setter
    @Builder.Default
    private boolean isDraft = true;
}
