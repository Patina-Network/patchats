package org.patinanetwork.patchats.matchingalgo.pairing;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.model.MemberPair;
import org.patinanetwork.patchats.matchingalgo.model.PairingResult;
import org.patinanetwork.patchats.matchingalgo.scoring.PairScorer;

/**
 * Scores every possible pair with the given scorers, then takes the highest-scoring pairs first, skipping any pair
 * whose members are already taken. Members are shuffled up front so ties are broken randomly; with no scorers the
 * result is identical to {@link RandomPairer} for the same seed.
 */
public class GreedyPairer {

    private final Random random;
    private final List<PairScorer> scorers;

    public GreedyPairer(Random random, List<PairScorer> scorers) {
        this.random = random;
        this.scorers = List.copyOf(scorers);
    }

    public PairingResult pair(List<Member> members) {
        List<Member> shuffled = new ArrayList<>(members);
        Collections.shuffle(shuffled, random);

        List<MemberPair> candidates = new ArrayList<>();
        for (int i = 0; i < shuffled.size(); i++) {
            for (int j = i + 1; j < shuffled.size(); j++) {
                Member memberA = shuffled.get(i);
                Member memberB = shuffled.get(j);
                candidates.add(new MemberPair(memberA, memberB, score(memberA, memberB)));
            }
        }
        // List.sort is stable, so equal scores keep the shuffled order.
        candidates.sort(Comparator.comparingInt(MemberPair::score).reversed());

        Set<UUID> taken = new HashSet<>();
        List<MemberPair> pairs = new ArrayList<>();
        for (MemberPair candidate : candidates) {
            UUID idA = candidate.memberA().getId();
            UUID idB = candidate.memberB().getId();
            if (!taken.contains(idA) && !taken.contains(idB)) {
                pairs.add(candidate);
                taken.add(idA);
                taken.add(idB);
            }
        }

        Optional<Member> unmatched = shuffled.stream()
                .filter(member -> !taken.contains(member.getId()))
                .findFirst();
        return new PairingResult(pairs, unmatched);
    }

    private int score(Member memberA, Member memberB) {
        int total = 0;
        for (PairScorer scorer : scorers) {
            total += scorer.score(memberA, memberB);
        }
        return total;
    }
}
