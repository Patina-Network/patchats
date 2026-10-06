package org.patinanetwork.patchats.api.match;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
import org.patinanetwork.patchats.api.match.db.repos.MatchFilterCriteria;
import org.patinanetwork.patchats.api.match.db.repos.MatchRepo;
import org.patinanetwork.patchats.api.match.dto.CreateMatchRequest;
import org.patinanetwork.patchats.api.match.dto.MatchListItemResponse;
import org.patinanetwork.patchats.api.match.dto.MatchResponse;
import org.patinanetwork.patchats.api.match.dto.UpdateMatchRequest;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.common.web.exception.MatchCycleNotFoundException;
import org.patinanetwork.patchats.common.web.exception.MatchNotFoundException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepo matchRepo;
    private final MemberRepo memberRepo;
    private final MatchCycleRepo matchCycleRepo;

    public MatchResponse createMatch(CreateMatchRequest request) {
        if (request.memberAId() == null || request.memberBId() == null || request.matchCycleId() == null) {
            throw new ValidationException("Member A ID, Member B ID, and Match Cycle ID cannot be null.");
        }
        if (request.memberAId().equals(request.memberBId())) {
            throw new ValidationException("Member A and Member B cannot be the same.");
        }

        Member memberA = memberRepo
                .getMemberById(request.memberAId())
                .orElseThrow(() -> new MemberNotFoundException(request.memberAId()));
        Member memberB = memberRepo
                .getMemberById(request.memberBId())
                .orElseThrow(() -> new MemberNotFoundException(request.memberBId()));

        boolean activeA = memberA.isActive();
        boolean activeB = memberB.isActive();

        matchCycleRepo
                .getMatchCycleById(request.matchCycleId())
                .orElseThrow(() -> new MatchCycleNotFoundException(request.matchCycleId()));

        if (!activeA || !activeB) {
            throw new ValidationException("Both members must be active to create a match.");
        }

        Match match = Match.builder()
                .id(UUID.randomUUID())
                .memberAId(request.memberAId())
                .memberBId(request.memberBId())
                .matchCycleId(request.matchCycleId())
                .matchScore(0.0)
                .status(MatchStatus.PENDING)
                .build();

        Match createdMatch = matchRepo.createMatch(match);
        return MatchResponse.from(createdMatch);
    }

    public MatchResponse updateMatch(UpdateMatchRequest request, UUID id) {
        Match match = matchRepo.getMatchById(id).orElseThrow(() -> new MatchNotFoundException(id));

        boolean hasNoUpdates = Stream.of(request.memberAId(), request.memberBId(), request.matchCycleId())
                .allMatch(Objects::isNull);

        if (hasNoUpdates) {
            return MatchResponse.from(match);
        }

        if (request.memberAId() != null) {
            memberRepo
                    .getMemberById(request.memberAId())
                    .orElseThrow(() -> new MemberNotFoundException(request.memberAId()));
            match.setMemberAId(request.memberAId());
        }
        if (request.memberBId() != null) {
            memberRepo
                    .getMemberById(request.memberBId())
                    .orElseThrow(() -> new MemberNotFoundException(request.memberBId()));
            match.setMemberBId(request.memberBId());
        }
        if (request.matchCycleId() != null) {
            matchCycleRepo
                    .getMatchCycleById(request.matchCycleId())
                    .orElseThrow(() -> new MatchCycleNotFoundException(request.matchCycleId()));
            match.setMatchCycleId(request.matchCycleId());
        }

        if (match.getMemberAId().equals(match.getMemberBId())) {
            throw new ValidationException("Member A and Member B cannot be the same.");
        }

        Match updated = matchRepo.updateMatch(match).orElseThrow(() -> new MatchNotFoundException(id));
        return MatchResponse.from(updated);
    }

    public MatchResponse getMatchById(UUID id) {
        Match match = matchRepo.getMatchById(id).orElseThrow(() -> new MatchNotFoundException(id));
        return MatchResponse.from(match);
    }

    public MatchResponse setMatchStatus(UUID id, MatchStatus status) {
        Match match = matchRepo.setMatchStatus(id, status).orElseThrow(() -> new MatchNotFoundException(id));
        return MatchResponse.from(match);
    }

    public MatchResponse setMatchScore(UUID id, Double score) {
        Match match = matchRepo.setMatchScore(id, score).orElseThrow(() -> new MatchNotFoundException(id));
        return MatchResponse.from(match);
    }

    public MatchResponse deleteMatchById(UUID id) {
        Match match = matchRepo.deleteMatchById(id).orElseThrow(() -> new MatchNotFoundException(id));
        return MatchResponse.from(match);
    }

    public List<MatchListItemResponse> filterMatches(MatchFilterCriteria criteria) {
        return matchRepo.filterMatches(criteria).stream()
                .map(MatchListItemResponse::from)
                .toList();
    }
}
