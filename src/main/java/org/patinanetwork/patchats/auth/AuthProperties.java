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
}
