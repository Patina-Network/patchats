package org.patinanetwork.patchats.api.match.dto.match;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;
import org.patinanetwork.patchats.api.match.db.models.Match;

@Getter
@Builder
@ToString
@EqualsAndHashCode
public class AdminMatchResponse {

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final UUID matchId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final UUID memberAId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final UUID memberBId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final Integer matchCycleId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final String month;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final String status;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private final Double matchScore;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final Instant createdAt;

    public static AdminMatchResponse from(final Match match, final String month) {
        return AdminMatchResponse.builder()
                .matchId(match.getId())
                .memberAId(match.getMemberAId())
                .memberBId(match.getMemberBId())
                .matchCycleId(match.getMatchCycleId())
                .month(month)
                .status(match.getStatus())
                .matchScore(match.getMatchScore())
                .createdAt(match.getCreatedAt())
                .build();
    }
}
