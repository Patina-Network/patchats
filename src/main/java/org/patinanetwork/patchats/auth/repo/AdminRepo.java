package org.patinanetwork.patchats.auth.repo;

import java.util.List;
import org.patinanetwork.patchats.auth.dto.AdminDto;

/** Access to {@code admins}, the allowlist of administrator emails. */
public interface AdminRepo {

    /** Whether the raw address is on the admin allowlist. */
    boolean isAdmin(String email);

    /** All current admins, ordered by creation date ascending. */
    List<AdminDto> listAdmins();

    /** Adds an email to the allowlist and returns the stored row. Throws on a duplicate email. */
    AdminDto addAdmin(String email, String note);

    /**
     * Removes an email from the allowlist. Normalisation is applied before lookup, so casing and surrounding whitespace
     * are ignored. Returns {@code true} if a row was deleted, {@code false} if the address was not found.
     */
    boolean removeAdmin(String email);
}
