package org.patinanetwork.patchats.email;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Email sender configuration, bound from {@code app.email.*}. */
@ConfigurationProperties(prefix = "app.email")
@Validated
@Getter
@Setter
public class EmailProperties {

    /** The verified From address, e.g. {@code coffeechats@patinanetwork.org}. */
    private String from;

    /** Optional display name shown alongside the From address. */
    private String fromName;

    /** The amount of emails sent out per batch (decision #7). */
    @Min(1)
    private int drainBatchSize = 50;

    /** Builds the From header: {@code "Name <addr>"} when a display name is set, else the bare address. */
    public String getFromHeader() {
        if (fromName == null || fromName.isBlank()) {
            return from;
        }
        return fromName + " <" + from + ">";
    }
}
