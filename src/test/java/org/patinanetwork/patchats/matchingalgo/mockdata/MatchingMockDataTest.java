package org.patinanetwork.patchats.matchingalgo.mockdata;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.MatchCycle;
import org.patinanetwork.patchats.api.member.db.models.Member;

class MatchingMockDataTest {

    private static final Set<String> MATCH_PREFS = Set.of(
            MatchingMockData.MENTOR, MatchingMockData.MENTEE, MatchingMockData.PEER, MatchingMockData.NO_PREFERENCE);
    private static final Set<String> INDUSTRIES =
            Set.of("Technology", "Finance", "Business", "Design", "Other", "No Preference");

    @Test
    void hasEightyMembersWithSeventyThreeActive() {
        assertEquals(80, MatchingMockData.members().size());
        assertEquals(73, MatchingMockData.activeMembers().size());
        assertEquals(
                80,
                MatchingMockData.members().stream()
                        .map(Member::getId)
                        .collect(Collectors.toSet())
                        .size());
    }

    @Test
    void membersOnlyUseSignUpDropdownValues() {
        for (Member member : MatchingMockData.members()) {
            assertTrue(MATCH_PREFS.contains(member.getMatchPref()), member.getEmail());
            assertTrue(INDUSTRIES.contains(member.getIndustryPref()), member.getEmail());
        }
    }

    @Test
    void hasSevenPublishedCycles() {
        List<MatchCycle> cycles = MatchingMockData.matchCycles();
        assertEquals(7, cycles.size());
        assertTrue(cycles.stream().noneMatch(MatchCycle::getIsDraft));
    }

    @Test
    void noMemberAppearsTwiceInOneCycle() {
        Map<Integer, List<Match>> byCycle =
                MatchingMockData.matches().stream().collect(Collectors.groupingBy(Match::getMatchCycleId));
        assertEquals(7, byCycle.size());
        byCycle.forEach((cycleId, matches) -> {
            Set<UUID> seen = new HashSet<>();
            for (Match match : matches) {
                assertTrue(seen.add(match.getMemberAId()), "cycle " + cycleId);
                assertTrue(seen.add(match.getMemberBId()), "cycle " + cycleId);
            }
        });
    }

    @Test
    void noPairRepeatsAcrossCycles() {
        assertEquals(
                MatchingMockData.matches().size(), MatchingMockData.pastPairs().size());
    }

    @Test
    void everyMatchReferencesKnownMembersAndCycles() {
        Set<UUID> memberIds =
                MatchingMockData.members().stream().map(Member::getId).collect(Collectors.toSet());
        Set<Integer> cycleIds =
                MatchingMockData.matchCycles().stream().map(MatchCycle::getId).collect(Collectors.toSet());
        for (Match match : MatchingMockData.matches()) {
            assertTrue(memberIds.contains(match.getMemberAId()));
            assertTrue(memberIds.contains(match.getMemberBId()));
            assertTrue(cycleIds.contains(match.getMatchCycleId()));
        }
    }
}
