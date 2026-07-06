package org.patinanetwork.patchats.api.member;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.common.db.models.member.Member;
import org.patinanetwork.patchats.common.db.repos.member.MemberRepo;
import org.patinanetwork.patchats.common.dto.member.CreateMemberRequest;
import org.patinanetwork.patchats.common.dto.member.MemberDto;
import org.patinanetwork.patchats.common.dto.member.UpdateMemberRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepo memberRepo;

    public MemberDto createMember(CreateMemberRequest request) {
        if (memberRepo.getMemberByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Member with email " + request.email() + " already exists");
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
        if (memberRepo.getMemberById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member with ID " + id + " does not exist");
        }
        Member member = Member.builder()
                .id(id)
                .fullName(request.fullName())
                .email(request.email())
                .linkedInUrl(request.linkedInUrl())
                .introduction(request.introduction())
                .matchPref(request.matchPref())
                .industryPref(request.industryPref())
                .rolePref(request.rolePref())
                .topics(request.topics())
                .extraNotes(request.extraNotes())
                .build();
        Member updatedMember = memberRepo
                .updateMember(member)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        return MemberDto.from(updatedMember);
    }

    public MemberDto getMemberById(UUID id) {
        return memberRepo
                .getMemberById(id)
                .map(MemberDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
    }

    public MemberDto deactivateMemberById(UUID id) {
        return memberRepo
                .deactivateMemberById(id)
                .map(MemberDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
    }
}
