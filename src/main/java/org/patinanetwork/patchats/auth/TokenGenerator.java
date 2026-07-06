package org.patinanetwork.patchats.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

/**
 * Mints the opaque magic-link tokens. The raw token goes into the emailed link and is never persisted; only its SHA-256
 * hex digest is stored, so a database leak cannot be replayed as a login.
 */
@Component
public class TokenGenerator {

    private static final int TOKEN_BYTES = 32;

    private final SecureRandom secureRandom = new SecureRandom();

    /** A freshly minted token: {@code raw} for the email link, {@code hash} for the database. */
    public record GeneratedToken(String raw, String hash) {}

    public GeneratedToken generate() {
        final byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        final String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return new GeneratedToken(raw, hash(raw));
    }

    /** SHA-256 hex digest of a raw token, used to look up what the client presents. */
    public static String hash(final String rawToken) {
        try {
            final MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (final NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
