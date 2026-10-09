package org.patinanetwork.patchats.matchingalgo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.mockdata.MatchingMockData;

class MatchPrefScorerTest {

    private final MatchPrefScorer scorer = new MatchPrefScorer();

    @Test
    void mentorWithMenteeIsCompatibleEitherWay() {
        assertEquals(MatchPrefScorer.COMPATIBLE_BONUS, score(MatchingMockData.MENTOR, MatchingMockData.MENTEE));
        assertEquals(MatchPrefScorer.COMPATIBLE_BONUS, score(MatchingMockData.MENTEE, MatchingMockData.MENTOR));
    }

    @Test
    void peerWithPeerIsCompatible() {
        assertEquals(MatchPrefScorer.COMPATIBLE_BONUS, score(MatchingMockData.PEER, MatchingMockData.PEER));
    }

    @Test
    void sameMentorshipSideConflicts() {
        assertEquals(MatchPrefScorer.CONFLICT_PENALTY, score(MatchingMockData.MENTOR, MatchingMockData.MENTOR));
        assertEquals(MatchPrefScorer.CONFLICT_PENALTY, score(MatchingMockData.MENTEE, MatchingMockData.MENTEE));
    }

    @Test
    void peerWithMentorshipConflicts() {
        assertEquals(MatchPrefScorer.CONFLICT_PENALTY, score(MatchingMockData.PEER, MatchingMockData.MENTOR));
        assertEquals(MatchPrefScorer.CONFLICT_PENALTY, score(MatchingMockData.MENTEE, MatchingMockData.PEER));
    }

    @Test
    void historyPenaltyOutweighsBestPreference() {
        assertTrue(HistoryScorer.REPEAT_PENALTY + MatchPrefScorer.COMPATIBLE_BONUS < MatchPrefScorer.CONFLICT_PENALTY);
    }

    private int score(String matchPrefA, String matchPrefB) {
        return scorer.score(member(matchPrefA), member(matchPrefB));
    }

    private static Member member(String matchPref) {
        return Member.builder().matchPref(matchPref).build();
    }
}
