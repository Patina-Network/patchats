package org.patinanetwork.patchats.api.match.dto.match;

import io.swagger.v3.oas.annotations.media.Schema;
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
public class MatchResponse {

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final UUID matchId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final UUID memberAId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final UUID memberBId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final String month;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final String status;

    public static MatchResponse from(final Match match, final String month) {
        return MatchResponse.builder()
                .matchId(match.getId())
                .memberAId(match.getMemberAId())
                .memberBId(match.getMemberBId())
                .month(month)
                .status(match.getStatus())
                .build();
    }
}
