package org.patinanetwork.patchats.matchingalgo.model;

/**
 * The match type a member asked for on sign-up. {@code Member.matchPref} stores the full dropdown text (e.g. "Mentor -
 * I am looking for guidance ..."), so values are recognized by their leading label.
 */
public enum MatchPreference {
    MENTOR("Mentor"),
    MENTEE("Mentee"),
    PEER("Peer"),
    NO_PREFERENCE("No Preference");

    private final String label;

    MatchPreference(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Parses a stored {@code matchPref} value. Missing or unrecognized values count as no preference. */
    public static MatchPreference fromMatchPref(String matchPref) {
        if (matchPref == null) {
            return NO_PREFERENCE;
        }
        String trimmed = matchPref.trim();
        for (MatchPreference preference : values()) {
            if (trimmed.regionMatches(true, 0, preference.label, 0, preference.label.length())) {
                return preference;
            }
        }
        return NO_PREFERENCE;
    }
}
