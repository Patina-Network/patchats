package org.patinanetwork.patchats.api.member;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberRequest;
import org.patinanetwork.patchats.common.web.exception.MemberDuplicateException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
import org.springframework.dao.DuplicateKeyException;
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

        // Return early if no fields are present in the request to update
        boolean hasNoUpdates = Stream.of(
                        request.firstName(),
                        request.lastName(),
                        request.email(),
                        request.introduction(),
                        request.linkedInUrl(),
                        request.matchPref(),
                        request.industryPref(),
                        request.rolePref(),
                        request.topics(),
                        request.extraNotes())
                .noneMatch(Optional::isPresent);
        if (hasNoUpdates) {
            return MemberDto.from(member);
        }

        validateAndUpdate(request.firstName(), member::setFirstName, "firstName", true);
        validateAndUpdate(request.lastName(), member::setLastName, "lastName", true);
        validateAndUpdate(request.email(), member::setEmail, "email", true);
        validateAndUpdate(request.introduction(), member::setIntroduction, "introduction", true);
        validateAndUpdate(request.linkedInUrl(), member::setLinkedInUrl, "linkedInUrl", false);
        validateAndUpdate(request.matchPref(), member::setMatchPref, "matchPref", false);
        validateAndUpdate(request.industryPref(), member::setIndustryPref, "industryPref", false);
        validateAndUpdate(request.rolePref(), member::setRolePref, "rolePref", false);
        validateAndUpdate(request.topics(), member::setTopics, "topics", false);
        validateAndUpdate(request.extraNotes(), member::setExtraNotes, "extraNotes", false);

        try {
            Member updatedMember = memberRepo.updateMember(member).orElseThrow(() -> new MemberNotFoundException(id));
            return MemberDto.from(updatedMember);
        } catch (DuplicateKeyException e) {
            throw new MemberDuplicateException(member.getEmail());
        }
    }

    private void validateAndUpdate(
            Optional<String> field, Consumer<String> setter, String fieldName, boolean required) {
        if (field.isPresent()) {
            String value = field.get();
            if (value.isBlank() && required) {
                throw new ValidationException(fieldName + " cannot be empty");
            }
            setter.accept(value);
        }
    }

    public MemberDto getMemberById(UUID id) {
        Member member = memberRepo.getMemberById(id).orElseThrow(() -> new MemberNotFoundException(id));
        return MemberDto.from(member);
    }

    // public MemberDto deactivateMember(UUID id) {
    //     return memberRepo
    //             .deactivateMember(id)
    //             .map(MemberDto::from)
    //             .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
    // }
}
