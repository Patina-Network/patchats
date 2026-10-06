package org.patinanetwork.patchats.api.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;

@Getter
@Builder
@ToString
@EqualsAndHashCode
public class MatchResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID id;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private UUID memberAId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID memberBId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer matchCycleId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Double matchScore;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private MatchStatus status;

    public static MatchResponse from(final Match match) {
        return MatchResponse.builder()
                .id(match.getId())
                .memberAId(match.getMemberAId())
                .memberBId(match.getMemberBId())
                .matchCycleId(match.getMatchCycleId())
                .matchScore(match.getMatchScore())
                .status(match.getStatus())
                .build();
    }
}
