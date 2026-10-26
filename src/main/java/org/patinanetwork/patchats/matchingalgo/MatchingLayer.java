package org.patinanetwork.patchats.matchingalgo;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Matching layers in the order they run. Selecting a layer runs it and every layer declared before it, so new layers
 * must be appended in priority order.
 */
public enum MatchingLayer {
    RANDOM("random"),
    HISTORY("history"),
    MATCH_PREF("match-pref"),
    INDUSTRY("industry");

    private final String cliName;

    MatchingLayer(String cliName) {
        this.cliName = cliName;
    }

    public String cliName() {
        return cliName;
    }

    public static Optional<MatchingLayer> fromCliName(String name) {
        return Arrays.stream(values())
                .filter(layer -> layer.cliName.equals(name))
                .findFirst();
    }

    /** This layer and every layer before it, in run order. */
    public List<MatchingLayer> upToAndIncluding() {
        return Arrays.stream(values())
                .filter(layer -> layer.ordinal() <= ordinal())
                .toList();
    }

    public static List<String> cliNames() {
        return Arrays.stream(values()).map(MatchingLayer::cliName).toList();
    }
}
