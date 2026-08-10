package org.patinanetwork.patchats.api.member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberRequest;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
@Tag(name = "Member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    public ResponseEntity<ApiResponder<MemberDto>> createMember(@Valid @RequestBody final CreateMemberRequest request) {
        final MemberDto response = memberService.createMember(request);
        return ResponseEntity.ok(ApiResponder.success("Member created successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all members", description = "Returns every member ordered by creation date.")
    public ResponseEntity<ApiResponder<List<MemberDto>>> getMembers() {
        final List<MemberDto> response = memberService.getMembers();
        return ResponseEntity.ok(ApiResponder.success("Members retrieved successfully", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponder<MemberDto>> updateMember(
            @Valid @RequestBody final UpdateMemberRequest request, @PathVariable final UUID id) {
        final MemberDto response = memberService.updateMember(request, id);
        return ResponseEntity.ok(ApiResponder.success("Member updated successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponder<MemberDto>> getMemberById(@PathVariable final UUID id) {
        final MemberDto response = memberService.getMemberById(id);
        return ResponseEntity.ok(ApiResponder.success("Member retrieved successfully", response));
    }

    // @DeleteMapping("/{id}")
    // public ResponseEntity<ApiResponder<MemberDto>> deactivateMember(@PathVariable final UUID id) {
    //     final MemberDto response = memberService.deactivateMemberById(id);
    //     return ResponseEntity.ok(ApiResponder.success("Member deactivated successfully", response));
    // }
}
