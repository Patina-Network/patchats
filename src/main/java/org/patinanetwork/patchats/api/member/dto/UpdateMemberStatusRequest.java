package org.patinanetwork.patchats.api.member.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Optional;

public record UpdateMemberStatusRequest(@NotNull Boolean active, Optional<String> deactivationReason) {}
