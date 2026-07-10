package org.patinanetwork.patchats.common.db.models.member;

import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Builder
@ToString
@EqualsAndHashCode
public class Member {

    private UUID id;

    @Setter
    private String fullName;

    @Setter
    private String email;

    @Setter
    private String linkedInUrl;

    @Setter
    private String introduction;

    @Setter
    private String referralSource;

    @Setter
    private boolean active;

    @Setter
    private String matchPref;

    @Setter
    private String industryPref;

    @Setter
    private String rolePref;

    @Setter
    private String topics;

    @Setter
    private String extraNotes;

    private String createdAt;

    private String updatedAt;
}
