package org.patinanetwork.patchats.common.web.exception;

public class MatchCycleDuplicateException extends RuntimeException {
    public MatchCycleDuplicateException(String period) {
        super("A Match Cycle already exists for period" + period);
    }
}
