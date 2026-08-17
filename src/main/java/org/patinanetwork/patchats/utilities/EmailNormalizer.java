package org.patinanetwork.patchats.utilities;

import java.util.Locale;

/**
 * The single definition of how an email address is canonicalised before it is stored or looked up.
 *
 * <p>Member lookups match the column exactly ({@code WHERE email = :email}), so every write and every read has to agree
 * on one form or rows become unreachable. Callers on both sides of that boundary — sign-up creating the row, auth
 * finding it — must run addresses through here rather than rolling their own trim/lowercase.
 */
public final class EmailNormalizer {

    private EmailNormalizer() {}

    /** Trims surrounding whitespace and lowercases in a locale-independent way. */
    public static String normalize(final String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
