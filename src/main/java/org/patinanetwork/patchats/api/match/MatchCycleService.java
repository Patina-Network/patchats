package org.patinanetwork.patchats.api.match;

import java.util.Optional;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
import org.patinanetwork.patchats.api.match.dto.CreateMatchCycleRequest;
import org.patinanetwork.patchats.api.match.dto.MatchCycleDto;
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

    public MatchCycleDto createMatchCycle(CreateMatchCycleRequest request) {
        if (matchCycleRepo.getMatchCycleByPeriod(request.period()).isPresent()) {
            throw new MatchCycleDuplicateException(request.period());
        }

        MatchCycle matchCycle = MatchCycle.builder()
                .period(request.period())
                .runAt(request.runAt())
                .isDraft(request.isDraft())
                .build();

        MatchCycle createdMatchCycle = matchCycleRepo.createMatchCycle(matchCycle);
        return MatchCycleDto.from(createdMatchCycle);
    }

    public MatchCycleDto updateMatchCycle(UpdateMatchCycleRequest request, Integer id) {
        MatchCycle matchCycle =
                matchCycleRepo.getMatchCycleById(id).orElseThrow(() -> new MatchCycleNotFoundException(id));

        boolean hasNoUpdates =
                Stream.of(request.period(), request.runAt(), request.isDraft()).noneMatch(Optional::isPresent);
        if (hasNoUpdates) {
            return MatchCycleDto.from(matchCycle);
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
            return MatchCycleDto.from(updated);
        } catch (DuplicateKeyException e) {
            throw new MatchCycleDuplicateException(request.period().orElse(matchCycle.getPeriod()));
        }
    }

    public MatchCycleDto setMatchCycleDraft(Integer id, boolean isDraft) {
        MatchCycle matchCycle = matchCycleRepo.setMatchCycleDraft(id, isDraft).orElseThrow();
        return MatchCycleDto.from(matchCycle);
    }

    public MatchCycleDto getMatchCycleById(Integer id) {
        MatchCycle matchCycle =
                matchCycleRepo.getMatchCycleById(id).orElseThrow(() -> new MatchCycleNotFoundException(id));
        return MatchCycleDto.from(matchCycle);
    }

    public MatchCycleDto deleteMatchCycleById(Integer id) {
        MatchCycle matchCycle =
                matchCycleRepo.deleteMatchCycleById(id).orElseThrow(() -> new MatchCycleNotFoundException(id));
        return MatchCycleDto.from(matchCycle);
    }

    public MatchCycleDto getMatchCycleByPeriod(String period) {
        MatchCycle matchCycle = matchCycleRepo.getMatchCycleByPeriod(period).orElseThrow();
        return MatchCycleDto.from(matchCycle);
    }
}
