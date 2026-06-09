package org.patinanetwork.patchats.email;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Email sender configuration, bound from {@code app.email.*}. */
@ConfigurationProperties(prefix = "app.email")
@Getter
@Setter
public class EmailProperties {

    /** The verified From address, e.g. {@code coffeechats@patinanetwork.org}. */
    private String from;

    /** Optional display name shown alongside the From address. */
    private String fromName;

    /** Builds the From header: {@code "Name <addr>"} when a display name is set, else the bare address. */
    public String getFromHeader() {
        if (fromName == null || fromName.isBlank()) {
            return from;
        }
        return fromName + " <" + from + ">";
    }
}
