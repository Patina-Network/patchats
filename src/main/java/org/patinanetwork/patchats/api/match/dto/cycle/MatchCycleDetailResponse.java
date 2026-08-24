package org.patinanetwork.patchats.api.match.dto.cycle;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;
import org.patinanetwork.patchats.api.match.dto.match.AdminMatchResponse;

@Getter
@Builder
@ToString
@EqualsAndHashCode
public class MatchCycleDetailResponse {

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final MatchCycleResponse cycle;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private final List<AdminMatchResponse> matches;
}
