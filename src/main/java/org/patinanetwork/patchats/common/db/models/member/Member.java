package org.patinanetwork.codebloom.common.db.models.member;

import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.patinanetwork.codebloom.common.db.helper.annotations.JoinColumn;
import org.patinanetwork.codebloom.common.db.helper.annotations.NotNullColumn;
import org.patinanetwork.codebloom.common.db.helper.annotations.NullColumn;
import org.patinanetwork.codebloom.common.db.models.achievements.Achievement;
import org.patinanetwork.codebloom.common.db.models.usertag.UserTag;

@Getter
@Setter
@SuperBuilder
@ToString
@EqualsAndHashCode
public class Member {

    @NotNullColumn
    private java.util.UUID id;

    @NotNullColumn
    private String fullName;

    @NotNullColumn
    private String email;

    @NullColumn
    private String linkedInUrl;

    @NotNullColumn
    private String introduction;

    @NullColumn
    private String referralSource;

    @NotNullColumn
    private boolean active;

    @NullColumn
    private String matchPref;

    @NullColumn
    private String industryPref;

    @NullColumn
    private String rolePref;

    @NullColumn
    private String topics;

    @NullColumn
    private String extraNotes;

    @NotNullColumn
    private String createdAt;

    @NotNullColumn
    private String updatedAt;
    /**
     * If you want to update tags in the database, you have to use the
     * {@link org.patinanetwork.codebloom.common.db.repos.usertag.UserTagRepository}
     */
    @JoinColumn
    @Builder.Default
    private List<UserTag> tags = new ArrayList<>();

    /**
     * If you want to update achievements in the database, you have to use the
     * {@link org.patinanetwork.codebloom.common.db.repos.achievements.AchievementRepository}
     */
    @JoinColumn
    @Builder.Default
    private List<Achievement> achievements = new ArrayList<>();

    /**
     * This operation is permitted, but the tag will not be used in update operations in the UserRepository. Instead
     * call this method with the parameter being the add method from
     * {@link org.patinanetwork.codebloom.common.db.repos.usertag.UserTagRepository}
     *
     * <p>Essentially, this operation should be used to keep the User model up-to-date with any Tag operations without
     * needlessly querying the database for the full User object.
     */
    public void addTag(final UserTag tag) {
        if (tag == null) {
            return;
        }

        tags.add(tag);
    }
}
