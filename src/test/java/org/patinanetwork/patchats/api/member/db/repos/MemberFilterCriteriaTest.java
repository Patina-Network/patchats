package org.patinanetwork.patchats.api.member.db.repos;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MemberFilterCriteriaTest {

    @Test
    void emptyReturnsCriteriaWithoutFilters() {
        final MemberFilterCriteria criteria = MemberFilterCriteria.empty();

        assertAll(
                () -> assertTrue(criteria.firstName().isEmpty()),
                () -> assertTrue(criteria.lastName().isEmpty()),
                () -> assertTrue(criteria.email().isEmpty()),
                () -> assertTrue(criteria.active().isEmpty()),
                () -> assertTrue(criteria.matchPref().isEmpty()),
                () -> assertTrue(criteria.industryPref().isEmpty()),
                () -> assertTrue(criteria.rolePref().isEmpty()),
                () -> assertTrue(criteria.topics().isEmpty()));
    }
}
