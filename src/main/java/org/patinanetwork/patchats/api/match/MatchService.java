package org.patinanetwork.patchats.api.match;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
import org.patinanetwork.patchats.api.match.db.repos.MatchFilterCriteria;
import org.patinanetwork.patchats.api.match.db.repos.MatchRepo;
import org.patinanetwork.patchats.api.match.dto.CreateMatchRequest;
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

    private void validateMatchRequest(UUID memberAId, UUID memberBId, Integer matchCycleId) {
        if (memberAId == null || memberBId == null || matchCycleId == null) {
            throw new ValidationException("Member A ID, Member B ID, and Match Cycle ID cannot be null.");
        }
        if (memberAId.equals(memberBId)) {
            throw new ValidationException("Member A and Member B cannot be the same.");
        }

        Member memberA = memberRepo.getMemberById(memberAId).orElseThrow(() -> new MemberNotFoundException(memberAId));
        Member memberB = memberRepo.getMemberById(memberBId).orElseThrow(() -> new MemberNotFoundException(memberBId));

        boolean activeA = memberA.isActive();
        boolean activeB = memberB.isActive();

        matchCycleRepo.getMatchCycleById(matchCycleId).orElseThrow(() -> new MatchCycleNotFoundException(matchCycleId));

        if (!activeA || !activeB) {
            throw new ValidationException("Both members must be active to create a match.");
        }
    }

    public MatchResponse createMatch(CreateMatchRequest request) {
        validateMatchRequest(request.memberAId(), request.memberBId(), request.matchCycleId());

        Match match = Match.builder()
                .id(UUID.randomUUID())
                .memberAId(request.memberAId())
                .memberBId(request.memberBId())
                .matchCycleId(request.matchCycleId())
                .matchScore(0.0)
                .status(MatchStatus.PENDING)
                .build();

        Match createdMatch = matchRepo.createMatch(match);
        return toResponse(createdMatch);
    }

    public MatchResponse updateMatch(UpdateMatchRequest request, UUID id) {
        Match match = matchRepo.getMatchById(id).orElseThrow(() -> new MatchNotFoundException(id));

        boolean hasNoUpdates = Stream.of(request.memberAId(), request.memberBId(), request.matchCycleId())
                .allMatch(Objects::isNull);

        if (hasNoUpdates) {
            return toResponse(match);
        }

        if (request.memberAId() != null) {
            match.setMemberAId(request.memberAId());
        }
        if (request.memberBId() != null) {
            match.setMemberBId(request.memberBId());
        }
        if (request.matchCycleId() != null) {
            match.setMatchCycleId(request.matchCycleId());
        }

        validateMatchRequest(match.getMemberAId(), match.getMemberBId(), match.getMatchCycleId());

        Match updated = matchRepo.updateMatch(match).orElseThrow(() -> new MatchNotFoundException(id));
        return toResponse(updated);
    }

    public MatchResponse getMatchById(UUID id) {
        Match match = matchRepo.getMatchById(id).orElseThrow(() -> new MatchNotFoundException(id));
        return toResponse(match);
    }

    public MatchResponse setMatchStatus(UUID id, MatchStatus status) {
        Match match = matchRepo.setMatchStatus(id, status).orElseThrow(() -> new MatchNotFoundException(id));
        return toResponse(match);
    }

    public MatchResponse setMatchScore(UUID id, Double score) {
        Match match = matchRepo.setMatchScore(id, score).orElseThrow(() -> new MatchNotFoundException(id));
        return toResponse(match);
    }

    public MatchResponse deleteMatchById(UUID id) {
        Match match = matchRepo.deleteMatchById(id).orElseThrow(() -> new MatchNotFoundException(id));
        return toResponse(match);
    }

    public List<MatchResponse> filterMatches(MatchFilterCriteria criteria) {
        // Shared across the page so a member or cycle that appears in several matches is only fetched once.
        Map<UUID, Member> members = new HashMap<>();
        Map<Integer, MatchCycle> matchCycles = new HashMap<>();
        return matchRepo.filterMatches(criteria).stream()
                .map(match -> toResponse(match, members, matchCycles))
                .toList();
    }

    private MatchResponse toResponse(Match match) {
        return toResponse(match, new HashMap<>(), new HashMap<>());
    }

    private MatchResponse toResponse(Match match, Map<UUID, Member> members, Map<Integer, MatchCycle> matchCycles) {
        Member memberA = members.computeIfAbsent(match.getMemberAId(), this::findMember);
        Member memberB = members.computeIfAbsent(match.getMemberBId(), this::findMember);
        MatchCycle matchCycle = matchCycles.computeIfAbsent(match.getMatchCycleId(), this::findMatchCycle);
        return MatchResponse.from(match, memberA, memberB, matchCycle);
    }

    private Member findMember(UUID id) {
        return memberRepo.getMemberById(id).orElseThrow(() -> new MemberNotFoundException(id));
    }

    private MatchCycle findMatchCycle(Integer id) {
        return matchCycleRepo.getMatchCycleById(id).orElseThrow(() -> new MatchCycleNotFoundException(id));
    }
}
