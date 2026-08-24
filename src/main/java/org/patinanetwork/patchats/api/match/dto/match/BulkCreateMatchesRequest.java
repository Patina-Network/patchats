package org.patinanetwork.patchats.api.match.dto.match;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BulkCreateMatchesRequest(@Valid @NotEmpty List<CreateMatchRequest> matches) {}
