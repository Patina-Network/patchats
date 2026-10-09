package org.patinanetwork.patchats.matchingalgo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.mockdata.MatchingMockData;

class HistoryScorerTest {

    private final HistoryScorer scorer = new HistoryScorer(MatchingMockData.matches());

    @Test
    void pastPairGetsPenalty() {
        Match past = MatchingMockData.matches().getFirst();
        Member memberA = member(past.getMemberAId());
        Member memberB = member(past.getMemberBId());

        assertEquals(HistoryScorer.REPEAT_PENALTY, scorer.score(memberA, memberB));
    }

    @Test
    void penaltyIgnoresOrder() {
        Match past = MatchingMockData.matches().getFirst();
        Member memberA = member(past.getMemberAId());
        Member memberB = member(past.getMemberBId());

        assertEquals(HistoryScorer.REPEAT_PENALTY, scorer.score(memberB, memberA));
    }

    @Test
    void newPairScoresZero() {
        List<Member> members = MatchingMockData.activeMembers();
        Member memberA = members.getFirst();
        Member memberB = members.stream()
                .filter(other -> !other.getId().equals(memberA.getId()))
                .filter(other -> !MatchingMockData.pastPairs().contains(Set.of(memberA.getId(), other.getId())))
                .findFirst()
                .orElseThrow();

        assertEquals(0, scorer.score(memberA, memberB));
    }

    @Test
    void noHistoryScoresZero() {
        List<Member> members = MatchingMockData.activeMembers();

        assertEquals(0, new HistoryScorer(List.of()).score(members.get(0), members.get(1)));
    }

    private static Member member(UUID id) {
        return MatchingMockData.members().stream()
                .filter(member -> member.getId().equals(id))
                .findFirst()
                .orElseThrow();
    }
}
