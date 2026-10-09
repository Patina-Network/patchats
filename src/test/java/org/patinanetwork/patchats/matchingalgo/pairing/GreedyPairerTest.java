package org.patinanetwork.patchats.matchingalgo.pairing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.mockdata.MatchingMockData;
import org.patinanetwork.patchats.matchingalgo.model.MemberPair;
import org.patinanetwork.patchats.matchingalgo.model.PairingResult;
import org.patinanetwork.patchats.matchingalgo.scoring.HistoryScorer;
import org.patinanetwork.patchats.matchingalgo.scoring.IndustryScorer;
import org.patinanetwork.patchats.matchingalgo.scoring.MatchPrefScorer;
import org.patinanetwork.patchats.matchingalgo.scoring.PairScorer;

class GreedyPairerTest {

    private static final long SEED = 42L;

    @Test
    void withNoScorersMatchesRandomPairer() {
        List<Member> members = MatchingMockData.activeMembers();

        PairingResult greedy = new GreedyPairer(new Random(SEED), List.of()).pair(members);
        PairingResult random = new RandomPairer(new Random(SEED)).pair(members);

        assertEquals(random, greedy);
    }

    @Test
    void picksHighestScoringPairFirst() {
        List<Member> members = MatchingMockData.activeMembers().subList(0, 4);
        Member favoriteA = members.get(0);
        Member favoriteB = members.get(3);
        PairScorer prefersFavorites =
                (a, b) -> Set.of(a.getId(), b.getId()).equals(Set.of(favoriteA.getId(), favoriteB.getId())) ? 10 : 0;

        PairingResult result = new GreedyPairer(new Random(SEED), List.of(prefersFavorites)).pair(members);

        assertTrue(result.pairs().stream()
                .anyMatch(pair -> pair.score() == 10
                        && Set.of(pair.memberA().getId(), pair.memberB().getId())
                                .equals(Set.of(favoriteA.getId(), favoriteB.getId()))));
    }

    @Test
    void historyScorerAvoidsRepeatsInMockData() {
        List<Member> members = MatchingMockData.activeMembers();
        Set<Set<UUID>> pastPairs = MatchingMockData.pastPairs();

        PairingResult result = new GreedyPairer(
                        new Random(SEED), List.of(new HistoryScorer(MatchingMockData.matches())))
                .pair(members);

        for (MemberPair pair : result.pairs()) {
            assertTrue(!pastPairs.contains(
                    Set.of(pair.memberA().getId(), pair.memberB().getId())));
            assertEquals(0, pair.score());
        }
    }

    @Test
    void everyoneAppearsOnceWithOneUnmatchedWhenOdd() {
        List<Member> members = MatchingMockData.activeMembers();

        PairingResult result = new GreedyPairer(
                        new Random(SEED), List.of(new HistoryScorer(MatchingMockData.matches())))
                .pair(members);

        Set<UUID> ids = new HashSet<>();
        result.pairs().forEach(pair -> {
            assertTrue(ids.add(pair.memberA().getId()));
            assertTrue(ids.add(pair.memberB().getId()));
        });
        result.unmatched().ifPresent(member -> assertTrue(ids.add(member.getId())));
        assertEquals(members.size(), ids.size());
        assertEquals(members.size() / 2, result.pairs().size());
        assertTrue(result.unmatched().isPresent());
    }

    @Test
    void repeatsOnlyWhenUnavoidable() {
        Member memberA = MatchingMockData.members().stream()
                .filter(member -> member.getId()
                        .equals(MatchingMockData.matches().getFirst().getMemberAId()))
                .findFirst()
                .orElseThrow();
        Member memberB = MatchingMockData.members().stream()
                .filter(member -> member.getId()
                        .equals(MatchingMockData.matches().getFirst().getMemberBId()))
                .findFirst()
                .orElseThrow();

        PairingResult result = new GreedyPairer(
                        new Random(SEED), List.of(new HistoryScorer(MatchingMockData.matches())))
                .pair(List.of(memberA, memberB));

        assertEquals(1, result.pairs().size());
        assertEquals(HistoryScorer.REPEAT_PENALTY, result.pairs().getFirst().score());
    }

    @Test
    void sameSeedGivesSamePairs() {
        List<Member> members = MatchingMockData.activeMembers();
        List<PairScorer> scorers = List.of(new HistoryScorer(MatchingMockData.matches()));

        assertEquals(
                new GreedyPairer(new Random(SEED), scorers).pair(members),
                new GreedyPairer(new Random(SEED), scorers).pair(members));
    }

    @Test
    void matchPrefLayerStillAvoidsRepeatsAndImprovesPreferences() {
        List<Member> members = MatchingMockData.activeMembers();
        Set<Set<UUID>> pastPairs = MatchingMockData.pastPairs();
        MatchPrefScorer prefScorer = new MatchPrefScorer();

        PairingResult historyOnly = new GreedyPairer(
                        new Random(SEED), List.of(new HistoryScorer(MatchingMockData.matches())))
                .pair(members);
        PairingResult withPrefs = new GreedyPairer(
                        new Random(SEED), List.of(new HistoryScorer(MatchingMockData.matches()), prefScorer))
                .pair(members);

        for (MemberPair pair : withPrefs.pairs()) {
            assertTrue(!pastPairs.contains(
                    Set.of(pair.memberA().getId(), pair.memberB().getId())));
        }
        assertTrue(totalPrefScore(withPrefs, prefScorer) > totalPrefScore(historyOnly, prefScorer));
    }

    @Test
    void industryLayerKeepsPrefsAndImprovesIndustry() {
        List<Member> members = MatchingMockData.activeMembers();
        Set<Set<UUID>> pastPairs = MatchingMockData.pastPairs();
        MatchPrefScorer prefScorer = new MatchPrefScorer();
        IndustryScorer industryScorer = new IndustryScorer();
        HistoryScorer historyScorer = new HistoryScorer(MatchingMockData.matches());

        PairingResult withoutIndustry =
                new GreedyPairer(new Random(SEED), List.of(historyScorer, prefScorer)).pair(members);
        PairingResult withIndustry =
                new GreedyPairer(new Random(SEED), List.of(historyScorer, prefScorer, industryScorer)).pair(members);

        for (MemberPair pair : withIndustry.pairs()) {
            assertTrue(!pastPairs.contains(
                    Set.of(pair.memberA().getId(), pair.memberB().getId())));
        }
        assertTrue(totalScore(withIndustry, industryScorer) > totalScore(withoutIndustry, industryScorer));
    }

    private static int totalScore(PairingResult result, PairScorer scorer) {
        return result.pairs().stream()
                .mapToInt(pair -> scorer.score(pair.memberA(), pair.memberB()))
                .sum();
    }

    private static int totalPrefScore(PairingResult result, MatchPrefScorer prefScorer) {
        return result.pairs().stream()
                .mapToInt(pair -> prefScorer.score(pair.memberA(), pair.memberB()))
                .sum();
    }
}
