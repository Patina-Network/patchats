package org.patinanetwork.patchats.email;

import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.PropertyPlaceholderHelper;

/**
 * Renders caller-supplied templates with logic-less {@code ${}} substitution (no expression evaluation, so client
 * templates cannot trigger server-side template injection).
 *
 * <p>Placeholder semantics: {@code ${x}} is required and throws when missing, {@code ${x:default}} falls back to the
 * default, and {@code ${x:}} blanks out.
 */
@Component
public class TemplateRenderer {

    private static final PropertyPlaceholderHelper HELPER = new PropertyPlaceholderHelper("${", "}", ":", null, false);

    /**
     * Substitutes placeholders in {@code template} using {@code variables}.
     *
     * @throws IllegalArgumentException if a required placeholder has neither a value nor a default
     */
    public String render(final String template, final Map<String, String> variables) {
        return HELPER.replacePlaceholders(template, variables::get);
    }
}
