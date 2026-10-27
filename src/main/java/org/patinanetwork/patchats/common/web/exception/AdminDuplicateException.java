package org.patinanetwork.patchats.common.web.exception;

public class AdminDuplicateException extends RuntimeException {
    public AdminDuplicateException(String email) {
        super(email + " is already an admin");
    }
}
