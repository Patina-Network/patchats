package org.patinanetwork.patchats.api.member.db.repos;

import java.util.Optional;

public record MemberFilterCriteria(
        Optional<String> firstName,
        Optional<String> lastName,
        Optional<String> email,
        Optional<Boolean> active,
        Optional<String> matchPref,
        Optional<String> industryPref,
        Optional<String> rolePref,
        Optional<String> topics) {

    public static MemberFilterCriteria empty() {
        return new MemberFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty());
    }
}
