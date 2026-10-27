package org.patinanetwork.patchats.common.web.exception;

public class AdminNotFoundException extends RuntimeException {
    public AdminNotFoundException(String email) {
        super("Admin not found: " + email);
    }
}
