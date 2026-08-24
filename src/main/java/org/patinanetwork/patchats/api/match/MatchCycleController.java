package org.patinanetwork.patchats.api.match;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.dto.CreateMatchCycleRequest;
import org.patinanetwork.patchats.api.match.dto.MatchCycleResponse;
import org.patinanetwork.patchats.api.match.dto.UpdateMatchCycleRequest;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/match_cycles")
@Tag(name = "Match Cycles")
@RequiredArgsConstructor
public class MatchCycleController {

    private final MatchCycleService matchCycleService;

    @Operation(summary = "Create a match cycle")
    @PostMapping
    public ResponseEntity<ApiResponder<MatchCycleResponse>> createMatchCycle(
            @Valid @RequestBody final CreateMatchCycleRequest request) {
        final MatchCycleResponse response = matchCycleService.createMatchCycle(request);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle created successfully", response));
    }

    @Operation(summary = "Update a match cycle")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponder<MatchCycleResponse>> updateMatchCycle(
            @Valid @RequestBody final UpdateMatchCycleRequest request, @PathVariable final Integer id) {
        final MatchCycleResponse response = matchCycleService.updateMatchCycle(request, id);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle updated successfully", response));
    }

    @Operation(summary = "Get a match cycle by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponder<MatchCycleResponse>> getMatchCycleById(@PathVariable final Integer id) {
        final MatchCycleResponse response = matchCycleService.getMatchCycleById(id);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle retrieved successfully", response));
    }

    @Operation(summary = "Delete a match cycle")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponder<MatchCycleResponse>> deleteMatchCycle(@PathVariable final Integer id) {
        final MatchCycleResponse response = matchCycleService.deleteMatchCycleById(id);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle deleted successfully", response));
    }
}
