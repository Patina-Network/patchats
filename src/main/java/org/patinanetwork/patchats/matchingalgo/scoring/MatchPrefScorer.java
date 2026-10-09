package org.patinanetwork.patchats.matchingalgo.scoring;

import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.model.MatchPreference;

/**
 * Rewards pairs whose match preferences fit together (Mentor with Mentee, Peer with Peer) and penalizes pairs whose
 * preferences conflict. Anyone with no preference is neutral.
 */
public class MatchPrefScorer implements PairScorer {

    public static final int COMPATIBLE_BONUS = 20;
    public static final int CONFLICT_PENALTY = -20;

    @Override
    public int score(Member memberA, Member memberB) {
        MatchPreference prefA = MatchPreference.fromMatchPref(memberA.getMatchPref());
        MatchPreference prefB = MatchPreference.fromMatchPref(memberB.getMatchPref());

        return isCompatible(prefA, prefB) ? COMPATIBLE_BONUS : CONFLICT_PENALTY;
    }

    private static boolean isCompatible(MatchPreference prefA, MatchPreference prefB) {
        return (prefA == MatchPreference.MENTOR && prefB == MatchPreference.MENTEE)
                || (prefA == MatchPreference.MENTEE && prefB == MatchPreference.MENTOR)
                || (prefA == MatchPreference.PEER && prefB == MatchPreference.PEER)
                || (prefA == MatchPreference.NO_PREFERENCE || prefB == MatchPreference.NO_PREFERENCE);
    }
}
