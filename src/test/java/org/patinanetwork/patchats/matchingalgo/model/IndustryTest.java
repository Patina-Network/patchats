package org.patinanetwork.patchats.matchingalgo.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class IndustryTest {

    @Test
    void parsesSignUpDropdownValues() {
        assertEquals(Industry.TECHNOLOGY, Industry.fromIndustryPref("Technology"));
        assertEquals(Industry.FINANCE, Industry.fromIndustryPref("Finance"));
        assertEquals(Industry.BUSINESS, Industry.fromIndustryPref("Business"));
        assertEquals(Industry.DESIGN, Industry.fromIndustryPref("Design"));
        assertEquals(Industry.OTHER, Industry.fromIndustryPref("Other"));
        assertEquals(Industry.NO_PREFERENCE, Industry.fromIndustryPref("No Preference"));
    }

    @Test
    void ignoresCaseAndWhitespace() {
        assertEquals(Industry.DESIGN, Industry.fromIndustryPref("  design "));
    }

    @Test
    void missingOrUnknownIsNoPreference() {
        assertEquals(Industry.NO_PREFERENCE, Industry.fromIndustryPref(null));
        assertEquals(Industry.NO_PREFERENCE, Industry.fromIndustryPref(""));
        assertEquals(Industry.NO_PREFERENCE, Industry.fromIndustryPref("Healthcare"));
    }

    @Test
    void otherAndNoPreferenceAreNotSpecific() {
        assertTrue(Industry.TECHNOLOGY.isSpecific());
        assertFalse(Industry.OTHER.isSpecific());
        assertFalse(Industry.NO_PREFERENCE.isSpecific());
    }
}
