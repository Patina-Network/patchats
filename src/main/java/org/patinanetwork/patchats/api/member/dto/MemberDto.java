package org.patinanetwork.patchats.api.member.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;
import org.patinanetwork.patchats.api.member.db.models.Member;

// TODO: Separate AdminMemberDto and PublicMemberDto
@Getter
@Builder
@ToString
@EqualsAndHashCode
public class MemberDto {

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID id;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String fullName;

    // TODO: Changes to email require verification after authentication is implemented
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String linkedInUrl;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String introduction;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String matchPref;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String industryPref;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String rolePref;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String topics;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    private String extraNotes;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Instant createdAt;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Instant updatedAt;

    public static MemberDto from(final Member member) {
        return MemberDto.builder()
                .id(member.getId())
                .fullName(member.getFullName())
                .email(member.getEmail())
                .linkedInUrl(member.getLinkedInUrl())
                .introduction(member.getIntroduction())
                .matchPref(member.getMatchPref())
                .industryPref(member.getIndustryPref())
                .rolePref(member.getRolePref())
                .topics(member.getTopics())
                .extraNotes(member.getExtraNotes())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
