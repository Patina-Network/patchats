package org.patinanetwork.patchats.matchingalgo.pairing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.mockdata.MatchingMockData;
import org.patinanetwork.patchats.matchingalgo.model.PairingResult;

class RandomPairerTest {

    private static final long SEED = 42L;

    @Test
    void evenCountPairsEveryoneOnce() {
        List<Member> members = MatchingMockData.activeMembers().subList(0, 44);

        PairingResult result = new RandomPairer(new Random(SEED)).pair(members);

        assertEquals(22, result.pairs().size());
        assertTrue(result.unmatched().isEmpty());
        assertEquals(idsOf(members), idsIn(result));
    }

    @Test
    void oddCountLeavesExactlyOneUnmatched() {
        List<Member> members = MatchingMockData.activeMembers();

        PairingResult result = new RandomPairer(new Random(SEED)).pair(members);

        assertEquals(members.size() / 2, result.pairs().size());
        assertTrue(result.unmatched().isPresent());
        assertEquals(idsOf(members), idsIn(result));
    }

    @Test
    void noMemberAppearsTwice() {
        PairingResult result = new RandomPairer(new Random(SEED)).pair(MatchingMockData.activeMembers());

        List<UUID> ids = new ArrayList<>();
        result.pairs().forEach(pair -> {
            ids.add(pair.memberA().getId());
            ids.add(pair.memberB().getId());
        });
        result.unmatched().ifPresent(member -> ids.add(member.getId()));
        assertEquals(ids.size(), new HashSet<>(ids).size());
    }

    @Test
    void everyPairScoresZero() {
        PairingResult result = new RandomPairer(new Random(SEED)).pair(MatchingMockData.activeMembers());

        result.pairs().forEach(pair -> assertEquals(0, pair.score()));
    }

    @Test
    void sameSeedGivesSamePairs() {
        List<Member> members = MatchingMockData.activeMembers();

        PairingResult first = new RandomPairer(new Random(SEED)).pair(members);
        PairingResult second = new RandomPairer(new Random(SEED)).pair(members);

        assertEquals(first, second);
    }

    @Test
    void doesNotModifyInput() {
        List<Member> members = new ArrayList<>(MatchingMockData.activeMembers());
        List<Member> original = List.copyOf(members);

        new RandomPairer(new Random(SEED)).pair(members);

        assertEquals(original, members);
    }

    @Test
    void emptyListGivesNothing() {
        PairingResult result = new RandomPairer(new Random(SEED)).pair(List.of());

        assertTrue(result.pairs().isEmpty());
        assertTrue(result.unmatched().isEmpty());
    }

    @Test
    void singleMemberIsUnmatched() {
        Member member = MatchingMockData.activeMembers().getFirst();

        PairingResult result = new RandomPairer(new Random(SEED)).pair(List.of(member));

        assertTrue(result.pairs().isEmpty());
        assertEquals(Optional.of(member), result.unmatched());
    }

    private static Set<UUID> idsOf(List<Member> members) {
        Set<UUID> ids = new HashSet<>();
        members.forEach(member -> ids.add(member.getId()));
        return ids;
    }

    private static Set<UUID> idsIn(PairingResult result) {
        Set<UUID> ids = new HashSet<>();
        result.pairs().forEach(pair -> {
            ids.add(pair.memberA().getId());
            ids.add(pair.memberB().getId());
        });
        result.unmatched().ifPresent(member -> ids.add(member.getId()));
        return ids;
    }
}
