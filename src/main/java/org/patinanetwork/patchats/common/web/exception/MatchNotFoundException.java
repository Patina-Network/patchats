package org.patinanetwork.patchats.common.web.exception;

import java.util.UUID;

public class MatchNotFoundException extends RuntimeException {
    public MatchNotFoundException(UUID id) {
        super("Match with ID " + id + " not found");
    }
}
