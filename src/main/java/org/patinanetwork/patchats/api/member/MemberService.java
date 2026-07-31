package org.patinanetwork.patchats.api.member;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberRequest;
import org.patinanetwork.patchats.common.web.exception.MemberDuplicateException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepo memberRepo;

    public MemberDto createMember(CreateMemberRequest request) {
        if (memberRepo.getMemberByEmail(request.email()).isPresent()) {
            throw new MemberDuplicateException(request.email());
        }
        Member member = Member.builder()
                .id(UUID.randomUUID())
                .fullName(request.fullName())
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
                .build();
        Member createdMember = memberRepo.createMember(member);
        return MemberDto.from(createdMember);
    }

    public MemberDto updateMember(UpdateMemberRequest request, UUID id) {
        Member member = memberRepo.getMemberById(id).orElseThrow(() -> new MemberNotFoundException(id));

        if (request.fullName() != null) {
            member.setFullName(request.fullName());
        }
        if (request.email() != null) {
            member.setEmail(request.email());
        }
        if (request.linkedInUrl() != null) {
            member.setLinkedInUrl(request.linkedInUrl());
        }
        if (request.introduction() != null) {
            member.setIntroduction(request.introduction());
        }
        if (request.matchPref() != null) {
            member.setMatchPref(request.matchPref());
        }
        if (request.industryPref() != null) {
            member.setIndustryPref(request.industryPref());
        }
        if (request.rolePref() != null) {
            member.setRolePref(request.rolePref());
        }
        if (request.topics() != null) {
            member.setTopics(request.topics());
        }
        if (request.extraNotes() != null) {
            member.setExtraNotes(request.extraNotes());
        }
        Member updatedMember = memberRepo.updateMember(member).orElseThrow(() -> new MemberNotFoundException(id));
        return MemberDto.from(updatedMember);
    }

    // TODO: Implement these methods after createMember and updateMember is fully functional and tested
    // public MemberDto getMemberById(UUID id) {
    //     return memberRepo
    //             .getMemberById(id)
    //             .map(MemberDto::from)
    //             .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
    // }

    // public MemberDto deactivateMember(UUID id) {
    //     return memberRepo
    //             .deactivateMember(id)
    //             .map(MemberDto::from)
    //             .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
    // }
}
