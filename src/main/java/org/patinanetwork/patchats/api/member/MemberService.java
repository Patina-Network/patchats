package org.patinanetwork.patchats.api.member;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberRequest;
import org.patinanetwork.patchats.common.web.exception.MemberDuplicateException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
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
                .build();
        Member createdMember = memberRepo.createMember(member);
        return MemberDto.from(createdMember);
    }

    public List<MemberDto> getMembers() {
        return memberRepo.getMembers().stream().map(MemberDto::from).toList();
    }

    public MemberDto updateMember(UpdateMemberRequest request, UUID id) {
        Member member = memberRepo.getMemberById(id).orElseThrow(() -> new MemberNotFoundException(id));

        // Validate that required fields are not empty
        if (request.firstName().isPresent()) {
            String firstName = request.firstName().get();
            if (firstName.isBlank()) {
                throw new ValidationException("firstName cannot be empty");
            }
            member.setFirstName(firstName);
        }

        if (request.lastName().isPresent()) {
            String lastName = request.lastName().get();
            if (lastName.isBlank()) {
                throw new ValidationException("lastName cannot be empty");
            }
            member.setLastName(lastName);
        }

        if (request.email().isPresent()) {
            String email = request.email().get();
            if (email.isBlank()) {
                throw new ValidationException("email cannot be empty");
            }
            if (!email.equals(member.getEmail())) {
                if (memberRepo.getMemberByEmail(email).isPresent()) {
                    throw new MemberDuplicateException(email);
                }
            }
            member.setEmail(email);
        }

        if (request.introduction().isPresent()) {
            String introduction = request.introduction().get();
            if (introduction.isBlank()) {
                throw new ValidationException("introduction cannot be empty");
            }
            member.setIntroduction(introduction);
        }

        // Update only the fields that are provided in the request
        if (request.linkedInUrl().isPresent()) {
            member.setLinkedInUrl(request.linkedInUrl().get());
        }
        if (request.matchPref().isPresent()) {
            member.setMatchPref(request.matchPref().get());
        }
        if (request.industryPref().isPresent()) {
            member.setIndustryPref(request.industryPref().get());
        }
        if (request.rolePref().isPresent()) {
            member.setRolePref(request.rolePref().get());
        }
        if (request.topics().isPresent()) {
            member.setTopics(request.topics().get());
        }
        if (request.extraNotes().isPresent()) {
            member.setExtraNotes(request.extraNotes().get());
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
