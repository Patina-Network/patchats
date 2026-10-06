package org.patinanetwork.patchats.api.match;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleFilterCriteria;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
import org.patinanetwork.patchats.api.match.dto.MatchCycleResponse;

class MatchCycleServiceTest {

    private final MatchCycleRepo matchCycleRepo = mock(MatchCycleRepo.class);
    private final MatchCycleService matchCycleService = new MatchCycleService(matchCycleRepo);

    // ---------- filterMatchCycles ----------

    @Test
    void filterMatchCyclesMapsEveryCycleToResponseInRepoOrder() {
        final MatchCycleFilterCriteria criteria = MatchCycleFilterCriteria.empty();
        final MatchCycle october = MatchCycle.builder()
                .id(3)
                .period("October 2026")
                .runAt(Instant.parse("2026-10-01T14:00:00Z"))
                .isDraft(false)
                .build();
        final MatchCycle september = MatchCycle.builder()
                .id(2)
                .period("September 2026")
                .runAt(Instant.parse("2026-09-01T14:00:00Z"))
                .isDraft(true)
                .build();
        when(matchCycleRepo.filterMatchCycles(criteria)).thenReturn(List.of(october, september));

        final List<MatchCycleResponse> result = matchCycleService.filterMatchCycles(criteria);

        assertEquals(List.of(MatchCycleResponse.from(october), MatchCycleResponse.from(september)), result);
        verify(matchCycleRepo).filterMatchCycles(criteria);
    }

    @Test
    void filterMatchCyclesPassesCriteriaThroughToRepo() {
        final MatchCycleFilterCriteria criteria = new MatchCycleFilterCriteria(
                Optional.of("October 2026"), Optional.empty(), Optional.empty(), Optional.of(false));
        when(matchCycleRepo.filterMatchCycles(criteria)).thenReturn(List.of());

        final List<MatchCycleResponse> result = matchCycleService.filterMatchCycles(criteria);

        assertEquals(List.of(), result);
        verify(matchCycleRepo).filterMatchCycles(criteria);
    }
}
