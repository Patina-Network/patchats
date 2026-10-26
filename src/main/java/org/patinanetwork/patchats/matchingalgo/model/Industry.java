package org.patinanetwork.patchats.matchingalgo.model;

/**
 * The industry a member is in or wants to get into, from the sign-up dropdown stored in {@code Member.industryPref}.
 * Comment - The current match preference dropdown includes description, the mock data does not
 */
public enum Industry {
    TECHNOLOGY("Technology"),
    FINANCE("Finance"),
    BUSINESS("Business"),
    DESIGN("Design"),
    OTHER("Other"),
    NO_PREFERENCE("No Preference");

    private final String label;

    Industry(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Whether two members with this industry share a specific field. "Other" covers many fields, so it does not. */
    public boolean isSpecific() {
        return this != OTHER && this != NO_PREFERENCE;
    }

    /** Parses a stored {@code industryPref} value. Missing or unrecognized values count as no preference. */
    public static Industry fromIndustryPref(String industryPref) {
        if (industryPref == null) {
            return NO_PREFERENCE;
        }
        String trimmed = industryPref.trim();
        for (Industry industry : values()) {
            if (industry.label.equalsIgnoreCase(trimmed)) {
                return industry;
            }
        }
        return NO_PREFERENCE;
    }
}
