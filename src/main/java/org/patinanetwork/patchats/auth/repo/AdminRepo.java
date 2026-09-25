package org.patinanetwork.patchats.auth.repo;

/**
 * Access to {@code admins}, the hand-maintained allowlist of administrator emails. There is deliberately no write path
 * here: rows are inserted directly against the database, so this repository only ever asks the one question sign-in
 * needs.
 */
public interface AdminRepo {

    /** Whether the raw address is on the admin allowlist. */
    boolean isAdmin(String email);
}
