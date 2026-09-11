package org.patinanetwork.patchats.api.match;

import java.util.Optional;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
import org.patinanetwork.patchats.api.match.dto.CreateMatchCycleRequest;
import org.patinanetwork.patchats.api.match.dto.MatchCycleResponse;
import org.patinanetwork.patchats.api.match.dto.UpdateMatchCycleRequest;
import org.patinanetwork.patchats.common.web.exception.MatchCycleDuplicateException;
import org.patinanetwork.patchats.common.web.exception.MatchCycleNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MatchCycleService {

    private final MatchCycleRepo matchCycleRepo;

    public MatchCycleResponse createMatchCycle(CreateMatchCycleRequest request) {
        if (matchCycleRepo.getMatchCycleByPeriod(request.period()).isPresent()) {
            throw new MatchCycleDuplicateException(request.period());
        }

        MatchCycle matchCycle = MatchCycle.builder()
                .period(request.period())
                .runAt(request.runAt())
                .isDraft(request.isDraft())
                .build();

        try {
            MatchCycle createdMatchCycle = matchCycleRepo.createMatchCycle(matchCycle);
            return MatchCycleResponse.from(createdMatchCycle);
        } catch (DuplicateKeyException e) {
            throw new MatchCycleDuplicateException(request.period());
        }
    }

    public MatchCycleResponse updateMatchCycle(UpdateMatchCycleRequest request, Integer id) {
        MatchCycle matchCycle =
                matchCycleRepo.getMatchCycleById(id).orElseThrow(() -> new MatchCycleNotFoundException(id));

        boolean hasNoUpdates =
                Stream.of(request.period(), request.runAt(), request.isDraft()).noneMatch(Optional::isPresent);
        if (hasNoUpdates) {
            return MatchCycleResponse.from(matchCycle);
        }

        if (request.period().isPresent()) {
            String period = request.period().get();
            if (period.isBlank()) {
                throw new ValidationException("period cannot be empty");
            }
            matchCycle.setPeriod(period);
        }
        request.runAt().ifPresent(matchCycle::setRunAt);
        request.isDraft().ifPresent(matchCycle::setIsDraft);

        try {
            MatchCycle updated =
                    matchCycleRepo.updateMatchCycle(matchCycle).orElseThrow(() -> new MatchCycleNotFoundException(id));
            return MatchCycleResponse.from(updated);
        } catch (DuplicateKeyException e) {
            throw new MatchCycleDuplicateException(request.period().orElse(matchCycle.getPeriod()));
        }
    }

    public MatchCycleResponse setMatchCycleIsDraft(Integer id, boolean isDraft) {
        MatchCycle matchCycle =
                matchCycleRepo.setMatchCycleIsDraft(id, isDraft).orElseThrow(() -> new MatchCycleNotFoundException(id));
        return MatchCycleResponse.from(matchCycle);
    }

    public MatchCycleResponse getMatchCycleById(Integer id) {
        MatchCycle matchCycle =
                matchCycleRepo.getMatchCycleById(id).orElseThrow(() -> new MatchCycleNotFoundException(id));
        return MatchCycleResponse.from(matchCycle);
    }

    public MatchCycleResponse deleteMatchCycleById(Integer id) {
        MatchCycle matchCycle =
                matchCycleRepo.deleteMatchCycleById(id).orElseThrow(() -> new MatchCycleNotFoundException(id));
        return MatchCycleResponse.from(matchCycle);
    }

    public MatchCycleResponse getMatchCycleByPeriod(String period) {
        MatchCycle matchCycle =
                matchCycleRepo.getMatchCycleByPeriod(period).orElseThrow(() -> new MatchCycleNotFoundException(period));
        return MatchCycleResponse.from(matchCycle);
    }

    // public MatchCycleResponse filterMatchCycles(MatchCycleFilterCriteria
    // criteria) {}
}
