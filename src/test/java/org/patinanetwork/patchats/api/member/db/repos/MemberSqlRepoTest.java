package org.patinanetwork.patchats.api.member.db.repos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MemberSqlRepoTest {

    private final MemberRepo memberRepo;
    private Member member;

    @Autowired
    MemberSqlRepoTest(final MemberRepo memberRepo) {
        this.memberRepo = memberRepo;
    }

    @BeforeAll
    void setUp() {
        final UUID id = UUID.randomUUID();
        member = memberRepo.createMember(Member.builder()
                .id(id)
                .firstName("Alex")
                .lastName("Morgan")
                .email("member-repo-test-" + id + "@example.com")
                .linkedInUrl("https://linkedin.com/in/alex")
                .introduction("Hello, I'm Alex")
                .referralSource("Friend")
                .active(true)
                .matchPref("Peer")
                .industryPref("Technology")
                .rolePref("Engineering")
                .topics("Community")
                .extraNotes("Available on weekdays")
                .build());
    }

    @AfterAll
    void cleanUp() {
        assertTrue(memberRepo.deleteMemberById(member.getId()));
    }

    @Test
    void getMembersByFilters_containsCreatedMember() {
        final MemberFilterCriteria criteria = new MemberFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                MemberFilterCriteria.DEFAULT_PAGE,
                MemberFilterCriteria.DEFAULT_PAGE_SIZE);

        final List<Member> result = memberRepo.getMembersByFilters(criteria);

        assertTrue(result.stream().anyMatch(foundMember -> foundMember.getId().equals(member.getId())));
    }

    @Test
    void getMembersByFilters_returnsMemberMatchingEveryCriterion() {
        final MemberFilterCriteria criteria = new MemberFilterCriteria(
                Optional.of(member.getFirstName().toLowerCase()),
                Optional.of(member.getLastName().toUpperCase()),
                Optional.of(member.getEmail().toUpperCase()),
                Optional.of(member.isActive()),
                Optional.of(member.getMatchPref().toLowerCase()),
                Optional.of(member.getIndustryPref().toUpperCase()),
                Optional.of(member.getRolePref().toLowerCase()),
                Optional.of(member.getTopics().toUpperCase()),
                MemberFilterCriteria.DEFAULT_PAGE,
                MemberFilterCriteria.DEFAULT_PAGE_SIZE);

        final List<Member> result = memberRepo.getMembersByFilters(criteria);

        assertEquals(1, result.size());
        assertMemberFields(result.getFirst(), member);
    }

    @Test
    void getMembersByFilters_usesOnlyProvidedCriteria() {
        final MemberFilterCriteria criteria = new MemberFilterCriteria(
                Optional.of(member.getFirstName()),
                Optional.empty(),
                Optional.empty(),
                Optional.of(member.isActive()),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.of(member.getTopics()),
                MemberFilterCriteria.DEFAULT_PAGE,
                MemberFilterCriteria.DEFAULT_PAGE_SIZE);

        final List<Member> result = memberRepo.getMembersByFilters(criteria);

        assertTrue(result.stream().anyMatch(foundMember -> foundMember.getId().equals(member.getId())));
    }

    @Test
    void updateMember_updatesEveryField() {
        final Member originalMember = member;
        final Member updatedMember = Member.builder()
                .id(originalMember.getId())
                .firstName("Taylor")
                .lastName("Reed")
                .email("updated-" + originalMember.getEmail())
                .linkedInUrl("https://linkedin.com/in/taylor")
                .introduction("Updated introduction")
                .referralSource("Patina event")
                .active(false)
                .matchPref("Mentor")
                .industryPref("Finance")
                .rolePref("Product Manager")
                .topics("Leadership")
                .extraNotes("Available on weekends")
                .build();

        try {
            final Member result = memberRepo.updateMember(updatedMember).orElseThrow();
            assertMemberFields(result, updatedMember);
            assertNotNull(result.getCreatedAt());
            assertNotNull(result.getUpdatedAt());
        } finally {
            member = memberRepo.updateMember(originalMember).orElseThrow();
        }
    }

    @Test
    void updateMember_returnsEmptyWhenMemberDoesNotExist() {
        final Member missingMember = Member.builder()
                .id(UUID.randomUUID())
                .firstName("Missing")
                .lastName("Member")
                .email("missing-" + UUID.randomUUID() + "@example.com")
                .introduction("This member is not persisted")
                .active(true)
                .build();

        assertTrue(memberRepo.updateMember(missingMember).isEmpty());
    }

    @Test
    void getMemberById_returnsMatchingMember() {
        final Optional<Member> result = memberRepo.getMemberById(member.getId());

        assertTrue(result.isPresent());
        assertMemberFields(result.orElseThrow(), member);
    }

    @Test
    void getMemberById_returnsEmptyWhenMemberDoesNotExist() {
        Optional<Member> emptyMember = memberRepo.getMemberById(UUID.randomUUID());
        assertTrue(emptyMember.isEmpty());
    }

    @Test
    void getMemberByEmail_returnsMatchingMember() {
        final Optional<Member> result = memberRepo.getMemberByEmail(member.getEmail());

        assertTrue(result.isPresent());
        assertMemberFields(result.orElseThrow(), member);
    }

    @Test
    void getMemberByEmail_returnsEmptyWhenMemberDoesNotExist() {
        assertTrue(memberRepo
                .getMemberByEmail("missing-" + UUID.randomUUID() + "@example.com")
                .isEmpty());
    }

    private static void assertMemberFields(final Member actual, final Member expected) {
        assertEquals(expected.getId(), actual.getId());
        assertEquals(expected.getFirstName(), actual.getFirstName());
        assertEquals(expected.getLastName(), actual.getLastName());
        assertEquals(expected.getEmail(), actual.getEmail());
        assertEquals(expected.getLinkedInUrl(), actual.getLinkedInUrl());
        assertEquals(expected.getIntroduction(), actual.getIntroduction());
        assertEquals(expected.getReferralSource(), actual.getReferralSource());
        assertEquals(expected.isActive(), actual.isActive());
        assertEquals(expected.getMatchPref(), actual.getMatchPref());
        assertEquals(expected.getIndustryPref(), actual.getIndustryPref());
        assertEquals(expected.getRolePref(), actual.getRolePref());
        assertEquals(expected.getTopics(), actual.getTopics());
        assertEquals(expected.getExtraNotes(), actual.getExtraNotes());
    }
}
