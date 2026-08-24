package org.patinanetwork.patchats.api.match;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.dto.match.AdminMatchResponse;
import org.patinanetwork.patchats.api.match.dto.match.CreateMatchRequest;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/matches")
@Tag(name = "Admin Matches")
@RequiredArgsConstructor
public class AdminMatchController {

    private final MatchService matchService;

    @Operation(summary = "Create a match between two members for a match cycle")
    @PostMapping
    public ResponseEntity<ApiResponder<AdminMatchResponse>> createMatch(
            @Valid @RequestBody final CreateMatchRequest request) {
        final AdminMatchResponse response = matchService.createMatch(request);
        return ResponseEntity.ok(ApiResponder.success("Match created successfully", response));
    }
}
