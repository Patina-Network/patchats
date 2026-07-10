package org.patinanetwork.patchats.common.web.exception;

public class MemberDuplicateException extends RuntimeException {
    public MemberDuplicateException(String email) {
        super("Member with email " + email + " already exists");
    }
}
