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

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberRequest;
import org.patinanetwork.patchats.common.web.exception.MemberDuplicateException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;

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
    void updateMember_throwsExceptionWhenMemberNotFound() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = MemberTestFixtures.UPDATE_REQUEST_ALL_FIELDS;

        when(memberRepo.getMemberById(id)).thenReturn(Optional.empty());

        assertThrows(MemberNotFoundException.class, () -> memberService.updateMember(request, id));
        verify(memberRepo, never()).updateMember(any());
    }

    @Test
    void updateMember_successWithOnlyNameField() {
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
    void updateMember_successWithAllNullFields() {
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

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any(Member.class))).thenReturn(Optional.of(existingMember));

        memberService.updateMember(request, id);

        verify(memberRepo).updateMember(captor.capture());
        final Member captured = captor.getValue();

        assertEquals("OldFirstName", captured.getFirstName());
        assertEquals("OldLastName", captured.getLastName());
        assertEquals("email@example.com", captured.getEmail());
        assertEquals("https://linkedin.com/in/john", captured.getLinkedInUrl());
        assertEquals("intro", captured.getIntroduction());
    }

    @Test
    void updateMember_successWithAllFields() {
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
        assertEquals("updated@example.com", captured.getEmail());
        assertEquals("https://linkedin.com/in/updated", captured.getLinkedInUrl());
        assertEquals("Updated intro", captured.getIntroduction());
        assertEquals("Mentor - I am looking for guidance from someone with more experience", captured.getMatchPref());
        assertEquals("Technology", captured.getIndustryPref());
        assertEquals("Software Engineer", captured.getRolePref());
        assertEquals("AI,ML", captured.getTopics());
        assertEquals("Notes", captured.getExtraNotes());
    }

    @Test
    void updateMember_throwsExceptionWhenEmailIsDuplicate() {
        final UUID id = UUID.randomUUID();
        final UUID otherMemberId = UUID.randomUUID();
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

        final Member otherMember =
                Member.builder().id(otherMemberId).email("existing@example.com").build();

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.getMemberByEmail("existing@example.com")).thenReturn(Optional.of(otherMember));

        assertThrows(MemberDuplicateException.class, () -> memberService.updateMember(request, id));
        verify(memberRepo, never()).updateMember(any());
    }

    @Test
    void updateMember_successWhenUpdatingWithSameEmail() {
        final UUID id = UUID.randomUUID();
        final UpdateMemberRequest request = new UpdateMemberRequest(
                Optional.empty(),
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
                .linkedInUrl("https://linkedin.com/in/john")
                .introduction("intro")
                .matchPref("Mentor")
                .industryPref("Tech")
                .rolePref("Engineer")
                .topics("AI")
                .extraNotes("notes")
                .build();

        when(memberRepo.getMemberById(id)).thenReturn(Optional.of(existingMember));
        when(memberRepo.updateMember(any())).thenReturn(Optional.of(existingMember));

        final ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);
        memberService.updateMember(request, id);
        verify(memberRepo).updateMember(captor.capture());
        final Member captured = captor.getValue();

        assertEquals("john@example.com", captured.getEmail());
        verify(memberRepo, never()).getMemberByEmail(any());
    }
}
