package org.patinanetwork.patchats.matchingalgo.scoring;

import org.patinanetwork.patchats.api.member.db.models.Member;

/** Scores how good a pairing of two members is. Higher is better; each matching layer contributes one scorer. */
@FunctionalInterface
public interface PairScorer {

    int score(Member memberA, Member memberB);
}
