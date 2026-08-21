package org.patinanetwork.patchats.email.db;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Converts a template-variable {@code Map<String, String>} to/from the {@code JSONB} text stored in
 * {@code emails.template_values}. SQL binds the string with a {@code ::jsonb} cast; reads come back as text.
 */
@Component
@RequiredArgsConstructor
public class JsonbConverter {

    private static final TypeReference<Map<String, String>> STRING_MAP = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    /** Serialises a variable map to a JSON object string (never null; an empty map becomes {@code "{}"}). */
    public String toJson(final Map<String, String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Map.of() : values);
        } catch (final com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalArgumentException("Could not serialise template values to JSON", ex);
        }
    }

    /** Parses stored JSONB text back into a variable map ({@code null}/blank becomes an empty map). */
    public Map<String, String> toMap(final String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, STRING_MAP);
        } catch (final com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalArgumentException("Could not parse template values JSON", ex);
        }
    }
}
