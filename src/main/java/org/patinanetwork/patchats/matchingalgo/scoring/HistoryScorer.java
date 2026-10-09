package org.patinanetwork.patchats.matchingalgo.scoring;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.member.db.models.Member;

/** Penalizes pairs who have been matched in any previous cycle, so repeats only happen as a last resort. */
public class HistoryScorer implements PairScorer {

    public static final int REPEAT_PENALTY = -100;

    private final Set<Set<UUID>> pastPairs = new HashSet<>();

    public HistoryScorer(Collection<Match> pastMatches) {
        for (Match match : pastMatches) {
            pastPairs.add(Set.of(match.getMemberAId(), match.getMemberBId()));
        }
    }

    @Override
    public int score(Member memberA, Member memberB) {
        return pastPairs.contains(Set.of(memberA.getId(), memberB.getId())) ? REPEAT_PENALTY : 0;
    }
}
