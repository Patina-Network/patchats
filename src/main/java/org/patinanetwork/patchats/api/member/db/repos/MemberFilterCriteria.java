package org.patinanetwork.patchats.api.member.db.repos;

import java.util.Optional;
import lombok.Builder;

@Builder
public record MemberFilterCriteria(
        Optional<String> firstName,
        Optional<String> lastName,
        Optional<String> email,
        Optional<Boolean> active,
        Optional<String> matchPref,
        Optional<String> industryPref,
        Optional<String> rolePref,
        Optional<String> topics,
        int page,
        int pageSize) {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_PAGE_SIZE = 25;
    public static final int MAX_PAGE_SIZE = 100;

    public MemberFilterCriteria {
        if (page < 1) {
            throw new IllegalArgumentException("page must be at least 1");
        }
        if (pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("pageSize must be between 1 and " + MAX_PAGE_SIZE);
        }
    }

    public long offset() {
        return (long) (page - 1) * pageSize;
    }
}
