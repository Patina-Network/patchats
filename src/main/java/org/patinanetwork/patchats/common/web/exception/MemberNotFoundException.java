package org.patinanetwork.patchats.common.web.exception;

import java.util.UUID;

public class MemberNotFoundException extends RuntimeException {
    public MemberNotFoundException(UUID id) {
        super("Member with ID " + id + " not found");
    }
}
