package org.patinanetwork.patchats.email;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;
import org.springframework.stereotype.Component;

/**
 * Renders a stored {@link EmailTemplate}'s subject and body from a variable map. This is the single render seam shared
 * by {@code /preview} and the {@code EmailDrainer} runner (decision #4) — so a preview renders byte-for-byte what the
 * runner will actually send, with no drift between the two.
 */
@Component
@RequiredArgsConstructor
public class EmailRenderer {

    private final TemplateRenderer renderer;

    /** @throws IllegalArgumentException if a required {@code ${}} placeholder has neither a value nor a default */
    public RenderedEmail render(final EmailTemplate template, final Map<String, String> variables) {
        return new RenderedEmail(
                renderer.render(template.getSubject(), variables), renderer.render(template.getBody(), variables));
    }

    /** Rendered subject/body ready to hand to {@code EmailSender}. */
    public record RenderedEmail(String subject, String body) {}
}
