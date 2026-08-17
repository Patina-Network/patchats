package org.patinanetwork.patchats.utilities;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Locale;
import org.junit.jupiter.api.Test;

class EmailNormalizerTest {

    @Test
    void trimsAndLowercases() {
        assertEquals("ann@example.com", EmailNormalizer.normalize("  Ann@Example.COM  "));
    }

    @Test
    void leavesAnAlreadyCanonicalAddressUnchanged() {
        assertEquals("ann@example.com", EmailNormalizer.normalize("ann@example.com"));
    }

    @Test
    void lowercasesIndependentlyOfTheDefaultLocale() {
        final Locale original = Locale.getDefault();
        try {
            // Turkish lowercases 'I' to a dotless 'ı'; the canonical form must not depend on where the server runs.
            Locale.setDefault(Locale.forLanguageTag("tr"));
            assertEquals("iris@example.com", EmailNormalizer.normalize("IRIS@EXAMPLE.COM"));
        } finally {
            Locale.setDefault(original);
        }
    }
}
