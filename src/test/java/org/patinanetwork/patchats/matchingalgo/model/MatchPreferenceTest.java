package org.patinanetwork.patchats.matchingalgo.model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.matchingalgo.mockdata.MatchingMockData;

class MatchPreferenceTest {

    @Test
    void parsesSignUpDropdownValues() {
        assertEquals(MatchPreference.MENTOR, MatchPreference.fromMatchPref(MatchingMockData.MENTOR));
        assertEquals(MatchPreference.MENTEE, MatchPreference.fromMatchPref(MatchingMockData.MENTEE));
        assertEquals(MatchPreference.PEER, MatchPreference.fromMatchPref(MatchingMockData.PEER));
        assertEquals(MatchPreference.NO_PREFERENCE, MatchPreference.fromMatchPref(MatchingMockData.NO_PREFERENCE));
    }

    @Test
    void parsesBareLabelsIgnoringCaseAndWhitespace() {
        assertEquals(MatchPreference.MENTEE, MatchPreference.fromMatchPref("  mentee"));
        assertEquals(MatchPreference.PEER, MatchPreference.fromMatchPref("PEER"));
    }

    @Test
    void missingOrUnknownIsNoPreference() {
        assertEquals(MatchPreference.NO_PREFERENCE, MatchPreference.fromMatchPref(null));
        assertEquals(MatchPreference.NO_PREFERENCE, MatchPreference.fromMatchPref(""));
        assertEquals(MatchPreference.NO_PREFERENCE, MatchPreference.fromMatchPref("Something else"));
    }
}
