package org.patinanetwork.patchats.api.member;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
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

        validateAndUpdateRequired(member, request);
        updateOptional(member, request);

        Member updatedMember = memberRepo.updateMember(member).orElseThrow(() -> new MemberNotFoundException(id));
        return MemberDto.from(updatedMember);
    }

    private void validateAndUpdateRequired(Member member, UpdateMemberRequest request) {
        validateAndUpdate(request.firstName(), member::setFirstName, "firstName");
        validateAndUpdate(request.lastName(), member::setLastName, "lastName");
        validateAndUpdateEmail(member, request);
        validateAndUpdate(request.introduction(), member::setIntroduction, "introduction");
    }

    private void validateAndUpdate(Optional<String> field, Consumer<String> setter, String fieldName) {
        if (field.isPresent()) {
            String value = field.get();
            if (value.isBlank()) {
                throw new ValidationException(fieldName + " cannot be empty");
            }
            setter.accept(value);
        }
    }

    private void validateAndUpdateEmail(Member member, UpdateMemberRequest request) {
        if (request.email().isPresent()) {
            String email = request.email().get();
            if (email.isBlank()) {
                throw new ValidationException("email cannot be empty");
            }
            if (!email.equals(member.getEmail())
                    && memberRepo.getMemberByEmail(email).isPresent()) {
                throw new MemberDuplicateException(email);
            }
            member.setEmail(email);
        }
    }

    private void updateOptional(Member member, UpdateMemberRequest request) {
        request.linkedInUrl().ifPresent(member::setLinkedInUrl);
        request.matchPref().ifPresent(member::setMatchPref);
        request.industryPref().ifPresent(member::setIndustryPref);
        request.rolePref().ifPresent(member::setRolePref);
        request.topics().ifPresent(member::setTopics);
        request.extraNotes().ifPresent(member::setExtraNotes);
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
