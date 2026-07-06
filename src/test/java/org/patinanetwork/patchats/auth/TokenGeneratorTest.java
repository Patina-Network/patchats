package org.patinanetwork.patchats.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.auth.TokenGenerator.GeneratedToken;

class TokenGeneratorTest {

    private final TokenGenerator generator = new TokenGenerator();

    @Test
    void rawTokenIsUrlSafeAnd256Bits() {
        final GeneratedToken token = generator.generate();

        // 32 bytes base64url without padding -> 43 chars, no characters needing URL encoding.
        assertEquals(43, token.raw().length());
        assertTrue(token.raw().matches("[A-Za-z0-9_-]+"));
    }

    @Test
    void hashMatchesSha256HexOfRaw() {
        final GeneratedToken token = generator.generate();

        assertEquals(TokenGenerator.hash(token.raw()), token.hash());
        assertEquals(64, token.hash().length());
        assertTrue(token.hash().matches("[0-9a-f]+"));
    }

    @Test
    void generatedTokensAreUnique() {
        assertNotEquals(generator.generate().raw(), generator.generate().raw());
    }

    @Test
    void hashIsDeterministic() {
        assertEquals(TokenGenerator.hash("abc"), TokenGenerator.hash("abc"));
        assertNotEquals(TokenGenerator.hash("abc"), TokenGenerator.hash("abd"));
    }
}
