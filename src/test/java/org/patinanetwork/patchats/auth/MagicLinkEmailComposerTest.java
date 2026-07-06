package org.patinanetwork.patchats.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.email.OutgoingEmail;
import org.patinanetwork.patchats.email.TemplateRenderer;

class MagicLinkEmailComposerTest {

    private final AtomicReference<OutgoingEmail> captured = new AtomicReference<>();
    private final AuthProperties properties = new AuthProperties();
    private final MagicLinkEmailComposer composer =
            new MagicLinkEmailComposer(new TemplateRenderer(), captured::set, properties);

    @Test
    void bodyContainsVerifyLinkAndTtl() {
        properties.setBaseUrl("https://patchats.example.org");

        composer.send("ann@example.com", "raw-token-123");

        final OutgoingEmail email = captured.get();
        assertNotNull(email);
        assertEquals(List.of("ann@example.com"), email.to());
        assertEquals("Your PatChats sign-in link", email.subject());
        assertTrue(email.body().contains("https://patchats.example.org/auth/verify?token=raw-token-123"));
        assertTrue(email.body().contains("expires in 15 minutes"));
    }

    @Test
    void trailingSlashInBaseUrlDoesNotDoubleUp() {
        properties.setBaseUrl("http://localhost:5173/");

        composer.send("ann@example.com", "tok");

        assertTrue(captured.get().body().contains("http://localhost:5173/auth/verify?token=tok"));
    }
}
