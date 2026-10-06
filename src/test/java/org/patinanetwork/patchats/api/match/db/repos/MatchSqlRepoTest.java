package org.patinanetwork.patchats.api.match.db.repos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.match.db.models.Match;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.patinanetwork.patchats.api.match.db.models.MatchListItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class MatchSqlRepoTest {

    private final MatchRepo matchRepo;
    private final JdbcClient jdbc;
    private String period;
    private Integer cycleId;
    private UUID alice;
    private UUID bob;
    private UUID carol;
    private Match aliceBob;
    private Match aliceCarol;

    @Autowired
    MatchSqlRepoTest(final MatchRepo matchRepo, final JdbcClient jdbc) {
        this.matchRepo = matchRepo;
        this.jdbc = jdbc;
    }

    @BeforeEach
    void setUp() {
        // A unique period keeps these fixtures apart from any rows already in the database.
        period = "match-repo-test-" + UUID.randomUUID();
        cycleId = jdbc.sql("INSERT INTO match_cycles (period, run_at) VALUES (:period, NOW()) RETURNING id")
                .param("period", period)
                .query(Integer.class)
                .single();

        alice = insertMember("Alice", "Technology");
        bob = insertMember("Bob", "Finance");
        carol = insertMember("Carol", "Healthcare");

        aliceBob = matchRepo.createMatch(newMatch(alice, bob, MatchStatus.PENDING));
        aliceCarol = matchRepo.createMatch(newMatch(alice, carol, MatchStatus.COMPLETED));
    }

    private UUID insertMember(final String firstName, final String industry) {
        final UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO members (id, first_name, last_name, email, introduction, active, industry_pref)
                VALUES (:id, :first_name, 'Test', :email, 'intro', TRUE, :industry_pref)
                """)
                .param("id", id)
                .param("first_name", firstName)
                .param("email", "match-repo-test-" + id + "@example.com")
                .param("industry_pref", industry)
                .update();
        return id;
    }

    private Match newMatch(final UUID memberA, final UUID memberB, final MatchStatus status) {
        return Match.builder()
                .id(UUID.randomUUID())
                .memberAId(memberA)
                .memberBId(memberB)
                .matchCycleId(cycleId)
                .matchScore(0.0)
                .status(status)
                .build();
    }

    private List<UUID> filterIds(
            final Optional<UUID> memberId, final Optional<String> memberIndustry, final Optional<MatchStatus> status) {
        final MatchFilterCriteria criteria = new MatchFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.of(period),
                memberId,
                Optional.empty(),
                memberIndustry,
                status);
        return matchRepo.filterMatches(criteria).stream()
                .map(item -> item.getMatch().getId())
                .toList();
    }

    @Test
    void createMatch_storesAndReturnsAllFields() {
        assertEquals(alice, aliceBob.getMemberAId());
        assertEquals(bob, aliceBob.getMemberBId());
        assertEquals(cycleId, aliceBob.getMatchCycleId());
        assertEquals(0.0, aliceBob.getMatchScore());
        assertEquals(MatchStatus.PENDING, aliceBob.getStatus());
        assertNotNull(aliceBob.getCreatedAt());
    }

    @Test
    void getMatchById_returnsMatchWhenExists() {
        final Match found = matchRepo.getMatchById(aliceBob.getId()).orElseThrow();

        assertEquals(aliceBob.getId(), found.getId());
        assertEquals(MatchStatus.PENDING, found.getStatus());
    }

    @Test
    void getMatchById_returnsEmptyWhenMissing() {
        assertTrue(matchRepo.getMatchById(UUID.randomUUID()).isEmpty());
    }

    @Test
    void updateMatch_overwritesEditableFields() {
        aliceBob.setMemberBId(carol);
        aliceBob.setMatchScore(0.5);
        aliceBob.setStatus(MatchStatus.CONFIRMED);

        final Match updated = matchRepo.updateMatch(aliceBob).orElseThrow();

        assertEquals(carol, updated.getMemberBId());
        assertEquals(0.5, updated.getMatchScore());
        assertEquals(MatchStatus.CONFIRMED, updated.getStatus());
    }

    @Test
    void updateMatch_returnsEmptyWhenMissing() {
        assertTrue(
                matchRepo.updateMatch(newMatch(alice, bob, MatchStatus.PENDING)).isEmpty());
    }

    @Test
    void setMatchStatus_updatesStatus() {
        final Match updated = matchRepo
                .setMatchStatus(aliceBob.getId(), MatchStatus.CANCELLED)
                .orElseThrow();

        assertEquals(MatchStatus.CANCELLED, updated.getStatus());
    }

    @Test
    void setMatchStatus_returnsEmptyWhenMissing() {
        assertTrue(matchRepo
                .setMatchStatus(UUID.randomUUID(), MatchStatus.CANCELLED)
                .isEmpty());
    }

    @Test
    void setMatchScore_updatesScore() {
        final Match updated = matchRepo.setMatchScore(aliceBob.getId(), 0.75).orElseThrow();

        assertEquals(0.75, updated.getMatchScore());
    }

    @Test
    void deleteMatchById_removesMatch() {
        final Match deleted = matchRepo.deleteMatchById(aliceBob.getId()).orElseThrow();

        assertEquals(aliceBob.getId(), deleted.getId());
        assertTrue(matchRepo.getMatchById(aliceBob.getId()).isEmpty());
    }

    @Test
    void deleteMatchById_returnsEmptyWhenMissing() {
        assertTrue(matchRepo.deleteMatchById(UUID.randomUUID()).isEmpty());
    }

    @Test
    void filterMatches_byPeriodReturnsMatchesWithNamesAndPeriod() {
        final MatchFilterCriteria criteria = new MatchFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.of(period),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());

        final List<MatchListItem> result = matchRepo.filterMatches(criteria);

        assertEquals(2, result.size());
        final MatchListItem item = result.stream()
                .filter(i -> i.getMatch().getId().equals(aliceBob.getId()))
                .findFirst()
                .orElseThrow();
        assertEquals(period, item.getPeriod());
        assertEquals("Alice", item.getMemberAFirstName());
        assertEquals("Bob", item.getMemberBFirstName());
    }

    @Test
    void filterMatches_byStatusReturnsOnlyThatStatus() {
        assertEquals(
                List.of(aliceCarol.getId()),
                filterIds(Optional.empty(), Optional.empty(), Optional.of(MatchStatus.COMPLETED)));
    }

    @Test
    void filterMatches_byMemberMatchesEitherSide() {
        assertEquals(List.of(aliceCarol.getId()), filterIds(Optional.of(carol), Optional.empty(), Optional.empty()));
    }

    @Test
    void filterMatches_byIndustryMatchesEitherMemberIgnoringCase() {
        assertEquals(List.of(aliceBob.getId()), filterIds(Optional.empty(), Optional.of("finance"), Optional.empty()));
    }

    @Test
    void filterMatches_byTimeRangeIncludesMatchesCreatedInside() {
        final MatchFilterCriteria criteria = new MatchFilterCriteria(
                Optional.of(Instant.now().minusSeconds(3600)),
                Optional.of(Instant.now().plusSeconds(3600)),
                Optional.of(period),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());

        final List<UUID> ids = matchRepo.filterMatches(criteria).stream()
                .map(item -> item.getMatch().getId())
                .toList();

        assertTrue(ids.containsAll(List.of(aliceBob.getId(), aliceCarol.getId())));
    }
}
