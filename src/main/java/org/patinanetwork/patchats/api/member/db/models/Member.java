package org.patinanetwork.patchats.api.member.db.models;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Builder
@Setter
@ToString
@EqualsAndHashCode
public class Member {

    private UUID id;

    @Setter
    private String firstName;

    @Setter
    private String lastName;

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

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;
}
