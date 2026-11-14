package org.patinanetwork.patchats.auth.dto;

import java.time.OffsetDateTime;

public record AdminDto(String email, String note, OffsetDateTime createdAt) {}
