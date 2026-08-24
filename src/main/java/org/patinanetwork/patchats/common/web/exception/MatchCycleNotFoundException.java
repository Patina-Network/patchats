package org.patinanetwork.patchats.common.web.exception;

public class MatchCycleNotFoundException extends RuntimeException {
    public MatchCycleNotFoundException(Integer id) {
        super("Match Cycle with ID " + id + " not found");
    }
}
