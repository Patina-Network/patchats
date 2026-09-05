package org.patinanetwork.patchats.api.match.dto;

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
public class MatchCycleDto {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String period;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Instant runAt;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Boolean isDraft;

    public static MatchCycleDto from(final MatchCycle matchCycle) {
        return MatchCycleDto.builder()
                .id(matchCycle.getId())
                .runAt(matchCycle.getRunAt())
                .period(matchCycle.getPeriod())
                .isDraft(matchCycle.getIsDraft())
                .build();
    }
}
