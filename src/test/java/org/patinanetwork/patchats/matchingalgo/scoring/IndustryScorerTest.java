package org.patinanetwork.patchats.matchingalgo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.member.db.models.Member;

class IndustryScorerTest {

    private final IndustryScorer scorer = new IndustryScorer();

    @Test
    void sameIndustryGetsBonus() {
        assertEquals(IndustryScorer.SAME_INDUSTRY_BONUS, score("Technology", "Technology"));
        assertEquals(IndustryScorer.SAME_INDUSTRY_BONUS, score("Finance", "finance"));
    }

    @Test
    void differentIndustryIsNeutral() {
        assertEquals(0, score("Technology", "Finance"));
    }

    @Test
    void otherIsNeutralEvenWithOther() {
        assertEquals(0, score("Other", "Other"));
        assertEquals(0, score("Other", "Design"));
    }

    @Test
    void noPreferenceIsNeutral() {
        assertEquals(0, score("No Preference", "No Preference"));
        assertEquals(0, score("No Preference", "Business"));
        assertEquals(0, score(null, "Business"));
    }

    private int score(String industryA, String industryB) {
        return scorer.score(member(industryA), member(industryB));
    }

    private static Member member(String industryPref) {
        return Member.builder().industryPref(industryPref).build();
    }
}
