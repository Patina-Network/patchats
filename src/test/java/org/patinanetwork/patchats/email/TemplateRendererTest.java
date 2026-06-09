package org.patinanetwork.patchats.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;
import org.junit.jupiter.api.Test;

class TemplateRendererTest {

    private final TemplateRenderer renderer = new TemplateRenderer();

    @Test
    void substitutesPresentValues() {
        assertEquals("Hi Ann", renderer.render("Hi ${name}", Map.of("name", "Ann")));
    }

    @Test
    void usesDefaultWhenMissing() {
        assertEquals("Hi friend", renderer.render("Hi ${name:friend}", Map.of()));
    }

    @Test
    void blanksWhenEmptyDefault() {
        assertEquals("Hi ", renderer.render("Hi ${name:}", Map.of()));
    }

    @Test
    void throwsWhenRequiredPlaceholderMissing() {
        assertThrows(IllegalArgumentException.class, () -> renderer.render("Hi ${name}", Map.of()));
    }

    @Test
    void resolvesNamespacedKeys() {
        assertEquals("Bob", renderer.render("${recipient2.firstName}", Map.of("recipient2.firstName", "Bob")));
    }
}
