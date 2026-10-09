package org.patinanetwork.patchats.matchingalgo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class MatchingLayerTest {

    @Test
    void layerResolvesFromCliName() {
        assertEquals(Optional.of(MatchingLayer.RANDOM), MatchingLayer.fromCliName("random"));
        assertEquals(List.of(MatchingLayer.RANDOM), MatchingLayer.RANDOM.upToAndIncluding());
    }

    @Test
    void historyRunsAfterRandom() {
        assertEquals(Optional.of(MatchingLayer.HISTORY), MatchingLayer.fromCliName("history"));
        assertEquals(List.of(MatchingLayer.RANDOM, MatchingLayer.HISTORY), MatchingLayer.HISTORY.upToAndIncluding());
    }

    @Test
    void matchPrefRunsAfterHistory() {
        assertEquals(Optional.of(MatchingLayer.MATCH_PREF), MatchingLayer.fromCliName("match-pref"));
        assertEquals(
                List.of(MatchingLayer.RANDOM, MatchingLayer.HISTORY, MatchingLayer.MATCH_PREF),
                MatchingLayer.MATCH_PREF.upToAndIncluding());
    }

    @Test
    void industryRunsAfterMatchPref() {
        assertEquals(Optional.of(MatchingLayer.INDUSTRY), MatchingLayer.fromCliName("industry"));
        assertEquals(
                List.of(MatchingLayer.RANDOM, MatchingLayer.HISTORY, MatchingLayer.MATCH_PREF, MatchingLayer.INDUSTRY),
                MatchingLayer.INDUSTRY.upToAndIncluding());
    }

    @Test
    void unknownLayerIsRejected() {
        assertTrue(MatchingLayer.fromCliName("nope").isEmpty());
    }
}
