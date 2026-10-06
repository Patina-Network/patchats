package org.patinanetwork.patchats.api.match;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleRepo;
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

class MatchServiceTest {

    private static final UUID MEMBER_A_ID = UUID.randomUUID();
    private static final UUID MEMBER_B_ID = UUID.randomUUID();
    private static final Integer CYCLE_ID = 1;

    private final MatchRepo matchRepo = mock(MatchRepo.class);
    private final MemberRepo memberRepo = mock(MemberRepo.class);
    private final MatchCycleRepo matchCycleRepo = mock(MatchCycleRepo.class);
    private final MatchService matchService = new MatchService(matchRepo, memberRepo, matchCycleRepo);

    private static Member member(UUID id, boolean active) {
        return Member.builder().id(id).active(active).build();
    }

    private static Match existingMatch(UUID id) {
        return Match.builder()
                .id(id)
                .memberAId(MEMBER_A_ID)
                .memberBId(MEMBER_B_ID)
                .matchCycleId(CYCLE_ID)
                .matchScore(0.0)
                .status(MatchStatus.PENDING)
                .build();
    }

    private void givenValidMembersAndCycle() {
        when(memberRepo.getMemberById(MEMBER_A_ID)).thenReturn(Optional.of(member(MEMBER_A_ID, true)));
        when(memberRepo.getMemberById(MEMBER_B_ID)).thenReturn(Optional.of(member(MEMBER_B_ID, true)));
        when(matchCycleRepo.getMatchCycleById(CYCLE_ID))
                .thenReturn(Optional.of(MatchCycle.builder().id(CYCLE_ID).build()));
    }

    // ---------- createMatch ----------

    @Test
    void createMatchSuccessWithValidMembersAndCycle() {
        givenValidMembersAndCycle();
        when(matchRepo.createMatch(any())).thenAnswer(invocation -> invocation.getArgument(0));

        final MatchResponse response =
                matchService.createMatch(new CreateMatchRequest(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID, null, null));

        final ArgumentCaptor<Match> captor = ArgumentCaptor.forClass(Match.class);
        verify(matchRepo).createMatch(captor.capture());
        final Match saved = captor.getValue();
        assertNotNull(saved.getId());
        assertEquals(MEMBER_A_ID, saved.getMemberAId());
        assertEquals(MEMBER_B_ID, saved.getMemberBId());
        assertEquals(CYCLE_ID, saved.getMatchCycleId());
        assertEquals(0.0, saved.getMatchScore());
        assertEquals(MatchStatus.PENDING, saved.getStatus());

        assertEquals(saved.getId(), response.getId());
        assertEquals(MatchStatus.PENDING, response.getStatus());
    }

    @Test
    void createMatchThrowsWhenMemberAIdIsNull() {
        final CreateMatchRequest request = new CreateMatchRequest(null, MEMBER_B_ID, CYCLE_ID, null, null);
        assertThrows(ValidationException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }

    @Test
    void createMatchThrowsWhenMemberBIdIsNull() {
        final CreateMatchRequest request = new CreateMatchRequest(MEMBER_A_ID, null, CYCLE_ID, null, null);
        assertThrows(ValidationException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }

    @Test
    void createMatchThrowsWhenMatchCycleIdIsNull() {
        final CreateMatchRequest request = new CreateMatchRequest(MEMBER_A_ID, MEMBER_B_ID, null, null, null);
        assertThrows(ValidationException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }

    @Test
    void createMatchThrowsWhenMembersAreTheSame() {
        final CreateMatchRequest request = new CreateMatchRequest(MEMBER_A_ID, MEMBER_A_ID, CYCLE_ID, null, null);
        assertThrows(ValidationException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }

    @Test
    void createMatchThrowsWhenMemberANotFound() {
        givenValidMembersAndCycle();
        when(memberRepo.getMemberById(MEMBER_A_ID)).thenReturn(Optional.empty());

        final CreateMatchRequest request = new CreateMatchRequest(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID, null, null);
        assertThrows(MemberNotFoundException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }

    @Test
    void createMatchThrowsWhenMemberAIsInactive() {
        givenValidMembersAndCycle();
        when(memberRepo.getMemberById(MEMBER_A_ID)).thenReturn(Optional.of(member(MEMBER_A_ID, false)));

        final CreateMatchRequest request = new CreateMatchRequest(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID, null, null);
        assertThrows(ValidationException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }

    @Test
    void createMatchThrowsWhenMatchCycleNotFound() {
        givenValidMembersAndCycle();
        when(matchCycleRepo.getMatchCycleById(CYCLE_ID)).thenReturn(Optional.empty());

        final CreateMatchRequest request = new CreateMatchRequest(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID, null, null);
        assertThrows(MatchCycleNotFoundException.class, () -> matchService.createMatch(request));
        verify(matchRepo, never()).createMatch(any());
    }

    // ---------- updateMatch ----------

    @Test
    void updateMatchSuccessWithAllFields() {
        final UUID matchId = UUID.randomUUID();
        final UUID newMemberAId = UUID.randomUUID();
        final UUID newMemberBId = UUID.randomUUID();
        final Integer newCycleId = 2;
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));
        when(memberRepo.getMemberById(newMemberAId)).thenReturn(Optional.of(member(newMemberAId, true)));
        when(memberRepo.getMemberById(newMemberBId)).thenReturn(Optional.of(member(newMemberBId, true)));
        when(matchCycleRepo.getMatchCycleById(newCycleId))
                .thenReturn(Optional.of(MatchCycle.builder().id(newCycleId).build()));
        when(matchRepo.updateMatch(any())).thenAnswer(invocation -> Optional.of(invocation.getArgument(0)));

        final MatchResponse response =
                matchService.updateMatch(new UpdateMatchRequest(newMemberAId, newMemberBId, newCycleId), matchId);

        assertEquals(newMemberAId, response.getMemberAId());
        assertEquals(newMemberBId, response.getMemberBId());
        assertEquals(newCycleId, response.getMatchCycleId());
    }

    @Test
    void updateMatchWithNoFieldsReturnsMatchUnchangedWithoutSaving() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));

        final MatchResponse response = matchService.updateMatch(new UpdateMatchRequest(null, null, null), matchId);

        assertEquals(MEMBER_A_ID, response.getMemberAId());
        assertEquals(MEMBER_B_ID, response.getMemberBId());
        assertEquals(CYCLE_ID, response.getMatchCycleId());
        verify(matchRepo, never()).updateMatch(any());
    }

    @Test
    void updateMatchPartialUpdateOnlyChangesProvidedFields() {
        final UUID matchId = UUID.randomUUID();
        final Integer newCycleId = 2;
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));
        givenValidMembersAndCycle();
        when(matchCycleRepo.getMatchCycleById(newCycleId))
                .thenReturn(Optional.of(MatchCycle.builder().id(newCycleId).build()));
        when(matchRepo.updateMatch(any())).thenAnswer(invocation -> Optional.of(invocation.getArgument(0)));

        final MatchResponse response =
                matchService.updateMatch(new UpdateMatchRequest(null, null, newCycleId), matchId);

        assertEquals(MEMBER_A_ID, response.getMemberAId());
        assertEquals(MEMBER_B_ID, response.getMemberBId());
        assertEquals(newCycleId, response.getMatchCycleId());
    }

    @Test
    void updateMatchThrowsWhenMatchNotFound() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.empty());

        final UpdateMatchRequest request = new UpdateMatchRequest(MEMBER_A_ID, null, null);
        assertThrows(MatchNotFoundException.class, () -> matchService.updateMatch(request, matchId));
        verify(matchRepo, never()).updateMatch(any());
    }

    @Test
    void updateMatchThrowsWhenNewMemberANotFound() {
        final UUID matchId = UUID.randomUUID();
        final UUID unknownMemberId = UUID.randomUUID();
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));
        givenValidMembersAndCycle();
        when(memberRepo.getMemberById(unknownMemberId)).thenReturn(Optional.empty());

        final UpdateMatchRequest request = new UpdateMatchRequest(unknownMemberId, null, null);
        assertThrows(MemberNotFoundException.class, () -> matchService.updateMatch(request, matchId));
        verify(matchRepo, never()).updateMatch(any());
    }

    @Test
    void updateMatchThrowsWhenBothMembersAreTheSame() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));
        givenValidMembersAndCycle();

        final UpdateMatchRequest request = new UpdateMatchRequest(MEMBER_A_ID, MEMBER_A_ID, null);
        assertThrows(ValidationException.class, () -> matchService.updateMatch(request, matchId));
        verify(matchRepo, never()).updateMatch(any());
    }

    @Test
    void updateMatchThrowsWhenSingleFieldChangeCreatesSelfMatch() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));
        givenValidMembersAndCycle();

        // Only member A changes, but it becomes equal to the existing member B.
        final UpdateMatchRequest request = new UpdateMatchRequest(MEMBER_B_ID, null, null);
        assertThrows(ValidationException.class, () -> matchService.updateMatch(request, matchId));
        verify(matchRepo, never()).updateMatch(any());
    }

    // ---------- getMatchById ----------

    @Test
    void getMatchByIdReturnsMatchWhenExists() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));

        final MatchResponse response = matchService.getMatchById(matchId);

        assertEquals(matchId, response.getId());
        assertEquals(MEMBER_A_ID, response.getMemberAId());
    }

    @Test
    void getMatchByIdThrowsWhenNotFound() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.getMatchById(matchId)).thenReturn(Optional.empty());

        assertThrows(MatchNotFoundException.class, () -> matchService.getMatchById(matchId));
    }

    // ---------- setMatchStatus ----------

    @Test
    void setMatchStatusReturnsUpdatedMatch() {
        final UUID matchId = UUID.randomUUID();
        final Match updated = existingMatch(matchId);
        updated.setStatus(MatchStatus.COMPLETED);
        when(matchRepo.setMatchStatus(matchId, MatchStatus.COMPLETED)).thenReturn(Optional.of(updated));

        final MatchResponse response = matchService.setMatchStatus(matchId, MatchStatus.COMPLETED);

        assertEquals(MatchStatus.COMPLETED, response.getStatus());
    }

    @Test
    void setMatchStatusThrowsWhenNotFound() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.setMatchStatus(matchId, MatchStatus.COMPLETED)).thenReturn(Optional.empty());

        assertThrows(MatchNotFoundException.class, () -> matchService.setMatchStatus(matchId, MatchStatus.COMPLETED));
    }

    // ---------- setMatchScore ----------

    @Test
    void setMatchScoreReturnsUpdatedMatch() {
        final UUID matchId = UUID.randomUUID();
        final Match updated = existingMatch(matchId);
        updated.setMatchScore(0.85);
        when(matchRepo.setMatchScore(matchId, 0.85)).thenReturn(Optional.of(updated));

        final MatchResponse response = matchService.setMatchScore(matchId, 0.85);

        assertEquals(0.85, response.getMatchScore());
    }

    @Test
    void setMatchScoreThrowsWhenNotFound() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.setMatchScore(matchId, 0.85)).thenReturn(Optional.empty());

        assertThrows(MatchNotFoundException.class, () -> matchService.setMatchScore(matchId, 0.85));
    }

    // ---------- deleteMatchById ----------

    @Test
    void deleteMatchByIdReturnsDeletedMatch() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.deleteMatchById(matchId)).thenReturn(Optional.of(existingMatch(matchId)));

        final MatchResponse response = matchService.deleteMatchById(matchId);

        assertEquals(matchId, response.getId());
    }

    @Test
    void deleteMatchByIdThrowsWhenNotFound() {
        final UUID matchId = UUID.randomUUID();
        when(matchRepo.deleteMatchById(matchId)).thenReturn(Optional.empty());

        assertThrows(MatchNotFoundException.class, () -> matchService.deleteMatchById(matchId));
    }
}
