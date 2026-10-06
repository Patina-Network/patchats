package org.patinanetwork.patchats.api.match;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.patinanetwork.patchats.api.match.db.repos.MatchFilterCriteria;
import org.patinanetwork.patchats.api.match.dto.CreateMatchRequest;
import org.patinanetwork.patchats.api.match.dto.MatchListItemResponse;
import org.patinanetwork.patchats.api.match.dto.MatchResponse;
import org.patinanetwork.patchats.api.match.dto.UpdateMatchRequest;
import org.patinanetwork.patchats.api.match.dto.UpdateMatchScoreRequest;
import org.patinanetwork.patchats.api.match.dto.UpdateMatchStatusRequest;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/match")
@Tag(name = "Match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @PostMapping("/admin")
    public ResponseEntity<ApiResponder<MatchResponse>> createMatch(
            @Valid @RequestBody final CreateMatchRequest request) {
        final MatchResponse response = matchService.createMatch(request);
        return ResponseEntity.ok(ApiResponder.success("Match created successfully", response));
    }

    @PatchMapping("/admin/{id}")
    public ResponseEntity<ApiResponder<MatchResponse>> updateMatch(
            @Valid @RequestBody final UpdateMatchRequest request, @PathVariable final UUID id) {
        final MatchResponse response = matchService.updateMatch(request, id);
        return ResponseEntity.ok(ApiResponder.success("Match updated successfully", response));
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<ApiResponder<MatchResponse>> getMatchById(@PathVariable final UUID id) {
        final MatchResponse response = matchService.getMatchById(id);
        return ResponseEntity.ok(ApiResponder.success("Match retrieved successfully", response));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<ApiResponder<MatchResponse>> deleteMatch(@PathVariable final UUID id) {
        final MatchResponse response = matchService.deleteMatchById(id);
        return ResponseEntity.ok(ApiResponder.success("Match deleted successfully", response));
    }

    @PatchMapping("/admin/{id}/status")
    public ResponseEntity<ApiResponder<MatchResponse>> setMatchStatus(
            @Valid @RequestBody final UpdateMatchStatusRequest request, @PathVariable final UUID id) {
        final MatchResponse response = matchService.setMatchStatus(id, request.status());
        return ResponseEntity.ok(ApiResponder.success("Match status updated successfully", response));
    }

    @PatchMapping("/admin/{id}/score")
    public ResponseEntity<ApiResponder<MatchResponse>> setMatchScore(
            @Valid @RequestBody final UpdateMatchScoreRequest request, @PathVariable final UUID id) {
        final MatchResponse response = matchService.setMatchScore(id, request.score());
        return ResponseEntity.ok(ApiResponder.success("Match score updated successfully", response));
    }

    @GetMapping
    @Operation(
            summary = "List matches",
            description = "Returns a page of matches matching the supplied filters, ordered by creation date. Pages "
                    + "are one-based; pageSize defaults to 25 and cannot exceed 100.")
    public ResponseEntity<ApiResponder<List<MatchListItemResponse>>> filterMatches(
            @RequestParam final Optional<Instant> startTime,
            @RequestParam final Optional<Instant> endTime,
            @RequestParam final Optional<String> period,
            @RequestParam final Optional<UUID> memberId,
            @RequestParam final Optional<Integer> matchCycleId,
            @RequestParam final Optional<String> memberIndustry,
            @RequestParam final Optional<MatchStatus> status,
            @RequestParam(defaultValue = "1") @Min(1) final int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) final int pageSize) {
        final MatchFilterCriteria criteria =
                new MatchFilterCriteria(startTime, endTime, period, memberId, matchCycleId, memberIndustry, status);
        final List<MatchListItemResponse> response = matchService.filterMatches(criteria);
        return ResponseEntity.ok(ApiResponder.success("Matches retrieved successfully", response));
    }
}
