package org.patinanetwork.patchats.api.match;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleFilterCriteria;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/match_cycles")
@Tag(name = "Match Cycles")
@RequiredArgsConstructor
public class MatchCycleController {

    private final MatchCycleService matchCycleService;

    @PostMapping
    public ResponseEntity<ApiResponder<MatchCycleResponse>> createMatchCycle(
            @Valid @RequestBody final CreateMatchCycleRequest request) {
        final MatchCycleResponse response = matchCycleService.createMatchCycle(request);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle created successfully", response));
    }

    @GetMapping
    @Operation(
            summary = "List match cycles",
            description =
                    "Returns a page of match cycles matching the supplied filters, ordered by run time (newest first). Pages are one-based; pageSize defaults to 25 and cannot exceed 100.")
    public ResponseEntity<ApiResponder<List<MatchCycleResponse>>> getMatchCycles(
            @RequestParam final Optional<String> period,
            @RequestParam final Optional<Instant> startTime,
            @RequestParam final Optional<Instant> endTime,
            @RequestParam final Optional<Boolean> isDraft,
            @RequestParam(defaultValue = "1") @Min(1) final int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) final int pageSize) {
        final MatchCycleFilterCriteria criteria =
                new MatchCycleFilterCriteria(period, startTime, endTime, isDraft, page, pageSize);
        final List<MatchCycleResponse> response = matchCycleService.listMatchCycle(criteria);
        return ResponseEntity.ok(ApiResponder.success("Match cycles retrieved successfully", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponder<MatchCycleResponse>> updateMatchCycle(
            @Valid @RequestBody final UpdateMatchCycleRequest request, @PathVariable final Integer id) {
        final MatchCycleResponse response = matchCycleService.updateMatchCycle(request, id);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle updated successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponder<MatchCycleResponse>> getMatchCycleById(@PathVariable final Integer id) {
        final MatchCycleResponse response = matchCycleService.getMatchCycleById(id);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle retrieved successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponder<MatchCycleResponse>> deleteMatchCycle(@PathVariable final Integer id) {
        final MatchCycleResponse response = matchCycleService.deleteMatchCycleById(id);
        return ResponseEntity.ok(ApiResponder.success("Match Cycle deleted successfully", response));
    }
}
