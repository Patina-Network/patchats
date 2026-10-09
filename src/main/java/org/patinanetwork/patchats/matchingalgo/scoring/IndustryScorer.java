package org.patinanetwork.patchats.matchingalgo.scoring;

import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.model.Industry;

/**
 * Rewards pairs in the same industry. Different industries, "Other" and no preference are neutral, so industry only
 * breaks ties between pairs that the earlier layers score equally.
 */
public class IndustryScorer implements PairScorer {

    public static final int SAME_INDUSTRY_BONUS = 10;

    @Override
    public int score(Member memberA, Member memberB) {
        Industry industryA = Industry.fromIndustryPref(memberA.getIndustryPref());
        Industry industryB = Industry.fromIndustryPref(memberB.getIndustryPref());
        return industryA.isSpecific() && industryA == industryB ? SAME_INDUSTRY_BONUS : 0;
    }
}
