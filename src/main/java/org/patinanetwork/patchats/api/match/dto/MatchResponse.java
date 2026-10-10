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
    private String memberAName;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID memberBId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String memberBName;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer matchCycleId;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String period;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Double matchScore;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private MatchStatus status;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Instant createdAt;

    public static MatchResponse from(final Match match) {
        return MatchResponse.builder()
                .id(match.getId())
                .memberAId(match.getMemberAId())
                .memberAName(fullName(match.getMemberAFirstName(), match.getMemberALastName()))
                .memberBId(match.getMemberBId())
                .memberBName(fullName(match.getMemberBFirstName(), match.getMemberBLastName()))
                .matchCycleId(match.getMatchCycleId())
                .period(match.getPeriod())
                .matchScore(match.getMatchScore())
                .status(match.getStatus())
                .createdAt(match.getCreatedAt())
                .build();
    }

    private static String fullName(final String firstName, final String lastName) {
        if (firstName == null && lastName == null) {
            return null;
        }
        if (firstName == null || lastName == null) {
            return firstName == null ? lastName : firstName;
        }
        return firstName + " " + lastName;
    }
}
