package org.patinanetwork.patchats.api.member.db.repos;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import org.junit.jupiter.api.Test;

class MemberFilterCriteriaTest {

    @Test
    void criteriaWithoutFiltersHasExpectedValues() {
        final MemberFilterCriteria criteria =
                criteriaWithPagination(MemberFilterCriteria.DEFAULT_PAGE, MemberFilterCriteria.DEFAULT_PAGE_SIZE);

        assertAll(
                () -> assertTrue(criteria.firstName().isEmpty()),
                () -> assertTrue(criteria.lastName().isEmpty()),
                () -> assertTrue(criteria.email().isEmpty()),
                () -> assertTrue(criteria.active().isEmpty()),
                () -> assertTrue(criteria.matchPref().isEmpty()),
                () -> assertTrue(criteria.industryPref().isEmpty()),
                () -> assertTrue(criteria.rolePref().isEmpty()),
                () -> assertTrue(criteria.topics().isEmpty()),
                () -> assertEquals(MemberFilterCriteria.DEFAULT_PAGE, criteria.page()),
                () -> assertEquals(MemberFilterCriteria.DEFAULT_PAGE_SIZE, criteria.pageSize()),
                () -> assertEquals(0, criteria.offset()));
    }

    @Test
    void calculatesOffsetFromPageAndPageSize() {
        final MemberFilterCriteria criteria = new MemberFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                3,
                20);

        assertEquals(40, criteria.offset());
    }

    @Test
    void rejectsInvalidPagination() {
        assertAll(
                () -> assertThrows(
                        IllegalArgumentException.class,
                        () -> criteriaWithPagination(0, MemberFilterCriteria.DEFAULT_PAGE_SIZE)),
                () -> assertThrows(IllegalArgumentException.class, () -> criteriaWithPagination(1, 0)),
                () -> assertThrows(
                        IllegalArgumentException.class,
                        () -> criteriaWithPagination(1, MemberFilterCriteria.MAX_PAGE_SIZE + 1)));
    }

    private static MemberFilterCriteria criteriaWithPagination(int page, int pageSize) {
        return new MemberFilterCriteria(
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                page,
                pageSize);
    }
}
