package org.patinanetwork.patchats.api.match;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
import org.patinanetwork.patchats.api.match.db.repos.MatchRepo;
import org.patinanetwork.patchats.api.match.dto.match.AdminMatchResponse;
import org.patinanetwork.patchats.api.match.dto.match.CreateMatchRequest;
import org.patinanetwork.patchats.common.web.exception.MatchCycleNotFoundException;

class MatchServiceTest {

    private final MatchRepo matchRepo = mock(MatchRepo.class);
    private final MatchCycleRepo matchCycleRepo = mock(MatchCycleRepo.class);
    private final MatchService matchService = new MatchService(matchRepo, matchCycleRepo);

    private MatchCycle stubCycle() {
        return MatchCycle.builder()
                .id(1)
                .period("2026-07")
                .runAt(Instant.parse("2026-07-15T10:00:00Z"))
                .build();
    }

    @Test
    void createMatch_successWithAllFields() {
        final CreateMatchRequest request =
                new CreateMatchRequest(UUID.randomUUID(), UUID.randomUUID(), 1, 0.85, "CONFIRMED");
        when(matchCycleRepo.getMatchCycleById(1)).thenReturn(Optional.of(stubCycle()));
        when(matchRepo.createMatch(any())).thenAnswer(invocation -> invocation.getArgument(0));

        final AdminMatchResponse response = matchService.createMatch(request);

        assertNotNull(response.getMatchId());
        assertEquals(request.memberAId(), response.getMemberAId());
        assertEquals(request.memberBId(), response.getMemberBId());
        assertEquals(1, response.getMatchCycleId());
        assertEquals("2026-07", response.getMonth());
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals(0.85, response.getMatchScore());
    }

    @Test
    void createMatch_defaultsStatusToPendingWhenStatusMissing() {
        final CreateMatchRequest request = new CreateMatchRequest(UUID.randomUUID(), UUID.randomUUID(), 1, null, null);
        when(matchCycleRepo.getMatchCycleById(1)).thenReturn(Optional.of(stubCycle()));
        when(matchRepo.createMatch(any())).thenAnswer(invocation -> invocation.getArgument(0));

        final AdminMatchResponse response = matchService.createMatch(request);

        assertEquals("PENDING", response.getStatus());
    }

    @Test
    void createMatch_throwsMatchCycleNotFoundWhenCycleMissing() {
        final CreateMatchRequest request = new CreateMatchRequest(UUID.randomUUID(), UUID.randomUUID(), 99, null, null);
        when(matchCycleRepo.getMatchCycleById(99)).thenReturn(Optional.empty());

        assertThrows(MatchCycleNotFoundException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }
}
