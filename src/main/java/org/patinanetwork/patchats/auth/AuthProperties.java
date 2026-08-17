package org.patinanetwork.patchats.auth;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Auth configuration, bound from {@code app.auth.*}. */
@ConfigurationProperties(prefix = "app.auth")
@Getter
@Setter
public class AuthProperties {

    /** Public origin of the SPA; magic links point at {@code <baseUrl>/auth/verify?token=...}. */
    private String baseUrl;

    /** Whether the session cookie carries the {@code Secure} flag. Off only for plain-HTTP dev. */
    private boolean cookieSecure = true;

    /** How long an emailed magic link stays valid. */
    private Duration magicLinkTtl = Duration.ofMinutes(15);

    /**
     * How often expired magic-link rows are swept from the database. Declared here so the key is documented and shows
     * up in config metadata; {@link MagicLinkTokenCleanup} resolves it as a {@code @Scheduled} placeholder, which
     * cannot read a bound bean.
     */
    private Duration tokenCleanupInterval = Duration.ofHours(1);
}
