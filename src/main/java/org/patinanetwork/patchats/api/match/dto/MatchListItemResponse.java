package org.patinanetwork.patchats.api.match.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.patinanetwork.patchats.api.match.db.models.MatchListItem;

@Getter
@Builder
@ToString
@EqualsAndHashCode
public class MatchListItemResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID id;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID memberAId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String memberAName;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID memberBId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String memberBName;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer matchCycleId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String period;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private Double matchScore;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private MatchStatus status;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Instant createdAt;

    public static MatchListItemResponse from(final MatchListItem item) {
        final Match match = item.getMatch();
        return MatchListItemResponse.builder()
                .id(match.getId())
                .memberAId(match.getMemberAId())
                .memberAName(item.getMemberAFirstName() + " " + item.getMemberALastName())
                .memberBId(match.getMemberBId())
                .memberBName(item.getMemberBFirstName() + " " + item.getMemberBLastName())
                .matchCycleId(match.getMatchCycleId())
                .period(item.getPeriod())
                .matchScore(match.getMatchScore())
                .status(match.getStatus())
                .createdAt(match.getCreatedAt())
                .build();
    }
}
