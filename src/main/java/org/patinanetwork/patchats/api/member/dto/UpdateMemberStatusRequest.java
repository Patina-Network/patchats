package org.patinanetwork.patchats.api.member.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMemberStatusRequest(@NotNull Boolean active) {}
