package org.patinanetwork.patchats.api.match;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
import org.patinanetwork.patchats.api.match.db.repos.MatchRepo;
import org.patinanetwork.patchats.api.match.dto.match.AdminMatchResponse;
import org.patinanetwork.patchats.api.match.dto.match.CreateMatchRequest;
import org.patinanetwork.patchats.common.web.exception.MatchCycleNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MatchService {

    private static final String DEFAULT_MATCH_STATUS = "PENDING";
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final MatchRepo matchRepo;
    private final MatchCycleRepo matchCycleRepo;

    public AdminMatchResponse createMatch(CreateMatchRequest request) {
        MatchCycle cycle = matchCycleRepo
                .getMatchCycleById(request.matchCycleId())
                .orElseThrow(() -> new MatchCycleNotFoundException(request.matchCycleId()));

        Match match = Match.builder()
                .id(UUID.randomUUID())
                .memberAId(request.memberAId())
                .memberBId(request.memberBId())
                .matchCycleId(request.matchCycleId())
                .matchScore(request.matchScore())
                .status(request.status() == null ? DEFAULT_MATCH_STATUS : request.status())
                .build();

        Match createdMatch = matchRepo.createMatch(match);
        return AdminMatchResponse.from(createdMatch, deriveMonth(cycle));
    }

    /** Derives the "YYYY-MM" month label for a match from its cycle's run time (UTC). */
    private String deriveMonth(final MatchCycle cycle) {
        return MONTH_FORMATTER.format(cycle.getRunAt().atZone(ZoneOffset.UTC));
    }
}
