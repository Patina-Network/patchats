package org.patinanetwork.patchats.api.member;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberFilterCriteria;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberStatusRequest;
import org.patinanetwork.patchats.common.web.exception.MemberDuplicateException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
import org.springframework.dao.DuplicateKeyException;

class MemberServiceTest {

    private final MemberRepo memberRepo = mock(MemberRepo.class);
    private final MemberService memberService = new MemberService(memberRepo);

    @Test
    void createMemberSuccessWithAllFieldsFilled() {
        final CreateMemberRequest request = MemberTestFixtures.CREATE_REQUEST_ALL_FIELDS;

        when(memberRepo.getMemberByEmail(any())).thenReturn(Optional.empty());
        when(memberRepo.createMember(any()))
                .thenReturn(Member.builder()
                        .id(UUID.randomUUID())
                        .firstName(request.firstName())
                        .lastName(request.lastName())
                        .email(request.email())
                        .linkedInUrl(request.linkedInUrl())
                        .introduction(request.introduction())
                        .referralSource(request.referralSource())
                        .active(true)
                        .matchPref(request.matchPref())
                        .industryPref(request.industryPref())
                        .rolePref(request.rolePref())
                        .topics(request.topics())
                        .extraNotes(request.extraNotes())
                        .build());
        final MemberDto response = memberService.createMember(request);

        assertEquals(request.firstName(), response.getFirstName());
        assertEquals(request.lastName(), response.getLastName());
        assertEquals(request.email(), response.getEmail());
        assertEquals(request.linkedInUrl(), response.getLinkedInUrl());
        assertEquals(request.introduction(), response.getIntroduction());
        assertEquals(request.referralSource(), response.getReferralSource());
        assertEquals(request.matchPref(), response.getMatchPref());
        assertEquals(request.industryPref(), response.getIndustryPref());
        assertEquals(request.rolePref(), response.getRolePref());
        assertEquals(request.topics(), response.getTopics());
        assertEquals(request.extraNotes(), response.getExtraNotes());

        assertNotNull(response.getId());
        assertTrue(response.getActive());
    }

    @Test
    void createMemberThrowsExceptionWhenEmailAlreadyExists() {
        final CreateMemberRequest request = MemberTestFixtures.CREATE_REQUEST_ALL_FIELDS;

        when(memberRepo.getMemberByEmail(any()))
                .thenReturn(Optional.of(Member.builder()
                        .id(UUID.randomUUID())
                        .firstName(request.firstName())
                        .lastName(request.lastName())
                        .email(request.email())
                        .linkedInUrl(request.linkedInUrl())
                        .introduction(request.introduction())
                        .referralSource(request.referralSource())
                        .active(true)
                        .matchPref(request.matchPref())
                        .industryPref(request.industryPref())
                        .rolePref(request.rolePref())
                        .topics(request.topics())
                        .extraNotes(request.extraNotes())
                        .build()));

        assertThrows(MemberDuplicateException.class, () -> memberService.createMember(request));
        verify(memberRepo, never()).createMember(any());
    }

    @Test
    void getMemberById_returnsMemberDtoWhenMemberExists() {
        final UUID id = UUID.randomUUID();
        final Member member = Member.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .linkedInUrl("https://www.linkedin.com/in/johndoe")
                .introduction("Hello, I'm John!")
                .referralSource("Friend")
                .active(true)
                .matchPref("Mentor")
                .industryPref("Technology")
                .rolePref("Software Engineer")
                .topics("Career Development")
                .extraNotes("Prefers in-person chats")
                .build();
        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(member));

        final MemberDto response = memberService.getMemberById(id);

        assertEquals(id, response.getId());
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        assertEquals("john.doe@example.com", response.getEmail());
        assertEquals("https://www.linkedin.com/in/johndoe", response.getLinkedInUrl());
        assertEquals("Hello, I'm John!", response.getIntroduction());
        assertEquals("Friend", response.getReferralSource());
        assertTrue(response.getActive());
        assertEquals("Mentor", response.getMatchPref());
        assertEquals("Technology", response.getIndustryPref());
        assertEquals("Software Engineer", response.getRolePref());
        assertEquals("Career Development", response.getTopics());
        assertEquals("Prefers in-person chats", response.getExtraNotes());
        verify(memberRepo).getMemberById(id);
    }

    @Test
    void getMemberById_throwsExceptionWhenMemberNotFound() {
        final UUID id = UUID.randomUUID();
        when(memberRepo.getMemberById(id)).thenReturn(Optional.empty());

        final MemberNotFoundException exception =
                assertThrows(MemberNotFoundException.class, () -> memberService.getMemberById(id));

        assertEquals("Member with ID " + id + " not found", exception.getMessage());
        verify(memberRepo).getMemberById(id);
    }

    @Test
    void updateMemberThrowsExceptionWhenMemberNotFound() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = MemberTestFixtures.UPDATE_REQUEST_ALL_FIELDS;

        when(memberRepo.getMemberById(id)).thenReturn(Optional.empty());

        assertThrows(MemberNotFoundException.class, () -> memberService.updateMember(request, id));
        verify(memberRepo, never()).updateMember(any());
    }

    @Test
    void updateMemberSuccessWithOnlyNameField() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = new UpdateMemberRequest(
                Optional.of("UpdatedFirstName"),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());

        final Member existingMember = Member.builder()
                .id(id)
                .firstName("OldFirstName")
                .lastName("OldLastName")
                .email("old@example.com")
                .linkedInUrl("https://linkedin.com/in/old")
                .introduction("Old intro")
                .matchPref("Mentor")
                .industryPref("Finance")
                .rolePref("Analyst")
                .topics("Economics")
                .extraNotes("Old notes")
                .build();

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any(Member.class))).thenReturn(Optional.of(existingMember));

        memberService.updateMember(request, id);

        verify(memberRepo).updateMember(captor.capture());
        final Member captured = captor.getValue();

        assertEquals("UpdatedFirstName", captured.getFirstName());
        assertEquals("old@example.com", captured.getEmail());
        assertEquals("https://linkedin.com/in/old", captured.getLinkedInUrl());
        assertEquals("Old intro", captured.getIntroduction());
    }

    @Test
    void updateMemberSuccessWithAllNullFields() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = new UpdateMemberRequest(
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());

        final Member existingMember = Member.builder()
                .id(id)
                .firstName("OldFirstName")
                .lastName("OldLastName")
                .email("email@example.com")
                .linkedInUrl("https://linkedin.com/in/john")
                .introduction("intro")
                .matchPref("Friend")
                .industryPref("Tech")
                .rolePref("Engineer")
                .topics("AI")
                .extraNotes("notes")
                .build();

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));

        final MemberDto response = memberService.updateMember(request, id);
        assertEquals("OldFirstName", response.getFirstName());
        assertEquals("OldLastName", response.getLastName());
        assertEquals("email@example.com", response.getEmail());
        assertEquals("https://linkedin.com/in/john", response.getLinkedInUrl());
        assertEquals("intro", response.getIntroduction());

        verify(memberRepo, never()).updateMember(any());
    }

    @Test
    void updateMemberSuccessWithAllFields() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = MemberTestFixtures.UPDATE_REQUEST_ALL_FIELDS;

        final Member existingMember = Member.builder()
                .id(id)
                .firstName("OldFirstName")
                .lastName("OldLastName")
                .email("old@example.com")
                .linkedInUrl("https://linkedin.com/in/old")
                .introduction("Old intro")
                .matchPref("Friend")
                .industryPref("Finance")
                .rolePref("Analyst")
                .topics("Economics")
                .extraNotes("Old notes")
                .build();

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any(Member.class))).thenReturn(Optional.of(existingMember));

        memberService.updateMember(request, id);

        verify(memberRepo).updateMember(captor.capture());
        final Member captured = captor.getValue();

        assertEquals("UpdatedFirstName", captured.getFirstName());
        assertEquals("UpdatedLastName", captured.getLastName());
        assertEquals("https://linkedin.com/in/updated", captured.getLinkedInUrl());
        assertEquals("Updated intro", captured.getIntroduction());
        assertEquals("Mentor - I am looking for guidance from someone with more experience", captured.getMatchPref());
        assertEquals("Technology", captured.getIndustryPref());
        assertEquals("Software Engineer", captured.getRolePref());
        assertEquals("AI,ML", captured.getTopics());
        assertEquals("Notes", captured.getExtraNotes());
    }

    @Disabled("Email changes are not currently supported, so this test is not applicable.")
    @Test
    void updateMember_throwsExceptionWhenEmailIsDuplicate() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = new UpdateMemberRequest(
                Optional.empty(),
                Optional.empty(),
                Optional.of("existing@example.com"),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());

        final Member existingMember = Member.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .build();

        when(memberRepo.updateMember(any(Member.class))).thenThrow(new DuplicateKeyException("Email already exists"));
        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        assertThrows(MemberDuplicateException.class, () -> memberService.updateMember(request, id));
    }

    @Test
    void updateMember_throwsValidationExceptionWhenEmailIsChanged() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = new UpdateMemberRequest(
                Optional.empty(),
                Optional.empty(),
                Optional.of("new@example.com"),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());

        final Member existingMember = Member.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .build();

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));

        assertThrows(ValidationException.class, () -> memberService.updateMember(request, id));
        verify(memberRepo, never()).updateMember(any());
    }

    @Test
    void updateMember_successWhenUpdatingOtherFieldsWithUnchangedEmail() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = new UpdateMemberRequest(
                Optional.of("UpdatedFirstName"),
                Optional.empty(),
                Optional.of("john@example.com"),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());

        final Member existingMember = Member.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .build();

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any(Member.class))).thenReturn(Optional.of(existingMember));

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);
        memberService.updateMember(request, id);

        verify(memberRepo).updateMember(captor.capture());
        final Member captured = captor.getValue();

        assertEquals("UpdatedFirstName", captured.getFirstName());
        assertEquals("john@example.com", captured.getEmail());
    }

    @Test
    void getMembers_returnsEveryMemberAsDto() {
        final MemberFilterCriteria criteria = emptyCriteria();

        final Member firstMember = Member.builder()
                .id(UUID.randomUUID())
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .active(true)
                .build();
        final Member secondMember = Member.builder()
                .id(UUID.randomUUID())
                .firstName("Jane")
                .lastName("Doe")
                .email("jane.doe@example.com")
                .active(false)
                .build();
        when(memberRepo.getMembersByFilters(criteria)).thenReturn(List.of(firstMember, secondMember));

        final List<MemberDto> response = memberService.getMembersByFilters(criteria);

        assertEquals(2, response.size());
        assertEquals(firstMember.getId(), response.get(0).getId());
        assertEquals("John", response.get(0).getFirstName());
        assertEquals("Doe", response.get(0).getLastName());
        assertEquals("jane.doe@example.com", response.get(1).getEmail());
    }

    @Test
    void getMembersReturnsEveryMemberAsDto() {
        final MemberFilterCriteria criteria = emptyCriteria();
        final Member firstMember = Member.builder()
                .id(UUID.randomUUID())
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .active(true)
                .build();
        final Member secondMember = Member.builder()
                .id(UUID.randomUUID())
                .firstName("Jane")
                .lastName("Doe")
                .email("jane.doe@example.com")
                .active(false)
                .build();
        when(memberRepo.getMembersByFilters(criteria)).thenReturn(List.of(firstMember, secondMember));

        final List<MemberDto> response = memberService.getMembersByFilters(criteria);

        assertEquals(2, response.size());
        assertEquals(firstMember.getId(), response.get(0).getId());
        assertEquals("John", response.get(0).getFirstName());
        assertEquals("Doe", response.get(0).getLastName());
        assertEquals("jane.doe@example.com", response.get(1).getEmail());
    }

    @Test
    void updateMemberStatus_deactivatesMember() {
        final UUID id = UUID.randomUUID();
        final Member existingMember = Member.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .active(true)
                .build();

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any(Member.class))).thenReturn(Optional.of(existingMember));

        memberService.updateMemberStatus(new UpdateMemberStatusRequest(false), id);

        verify(memberRepo).updateMember(captor.capture());
        assertEquals(false, captor.getValue().isActive());
    }

    @Test
    void updateMemberStatus_reactivatesMember() {
        final UUID id = UUID.randomUUID();
        final Member existingMember = Member.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .active(false)
                .build();

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any(Member.class))).thenReturn(Optional.of(existingMember));

        memberService.updateMemberStatus(new UpdateMemberStatusRequest(true), id);

        verify(memberRepo).updateMember(captor.capture());
        assertTrue(captor.getValue().isActive());
    }

    @Test
    void updateMemberStatus_deactivatingAnAlreadyInactiveMemberSucceeds() {
        final UUID id = UUID.randomUUID();
        final Member existingMember = Member.builder()
                .id(id)
                .firstName("John")
                .lastName("Doe")
                .active(false)
                .build();

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any(Member.class))).thenReturn(Optional.of(existingMember));

        final MemberDto response = memberService.updateMemberStatus(new UpdateMemberStatusRequest(false), id);

        verify(memberRepo).updateMember(captor.capture());
        assertEquals(false, captor.getValue().isActive());
        assertEquals(false, response.getActive());
    }

    @Test
    void updateMemberStatus_throwsWhenMemberNotFound() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberStatusRequest request = new UpdateMemberStatusRequest(false);
        when(memberRepo.getMemberById(id)).thenReturn(Optional.empty());

        assertThrows(MemberNotFoundException.class, () -> memberService.updateMemberStatus(request, id));
        verify(memberRepo, never()).updateMember(any());
    }

    private static MemberFilterCriteria emptyCriteria() {
        return new MemberFilterCriteria(
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
    }
}
