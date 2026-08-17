package org.patinanetwork.patchats.api.match.dto.cycle;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;

@Getter
@Builder
@ToString
@EqualsAndHashCode
public class MatchCycleResponse {

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final Integer matchCycleId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private final String period;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final Instant runAt;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final boolean isDraft;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final Integer totalMembers;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final Integer totalMatched;

    public static MatchCycleResponse from(final MatchCycle cycle) {
        return MatchCycleResponse.builder()
                .matchCycleId(cycle.getId())
                .period(cycle.getPeriod())
                .runAt(cycle.getRunAt())
                .isDraft(cycle.isDraft())
                .totalMembers(cycle.getTotalMembers())
                .totalMatched(cycle.getTotalMatched())
                .build();
    }
}
