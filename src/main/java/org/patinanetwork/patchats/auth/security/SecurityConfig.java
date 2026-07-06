package org.patinanetwork.patchats.auth.security;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.auth.AuthProperties;
import org.springframework.boot.autoconfigure.session.SessionProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * Wires cookie-session authentication on top of Spring Session JDBC.
 *
 * <p><b>How a request is authenticated.</b> Spring Session's {@code SessionRepositoryFilter} resolves the
 * {@code patchats_session} cookie into an {@code HttpSession} backed by the {@code spring_session} tables, and Spring
 * Security's {@code SecurityContextHolderFilter} restores the {@link AuthenticatedMember} principal that
 * {@code AuthController} saved at magic-link verification. There is no {@code JSESSIONID} and the server never adopts a
 * client-supplied session id, so session fixation is prevented by construction (verify additionally rotates any
 * pre-existing session id).
 *
 * <p><b>Why CSRF protection is disabled.</b> Three layers make the classic attack a no-op here: the session cookie is
 * {@code SameSite=Lax}, so browsers do not attach it to cross-site POSTs; every state-changing endpoint only consumes
 * {@code application/json} request bodies, which cross-site forms cannot produce and cross-origin {@code fetch} cannot
 * send without a CORS preflight (and no CORS mappings exist — the SPA is served same-origin, via the Vite proxy in
 * dev); and the one anonymous cookie-consuming POST, logout, is idempotent and harmless. Revisit if the cookie ever
 * needs {@code SameSite=None}.
 */
@Configuration
@EnableConfigurationProperties({AuthProperties.class, SessionProperties.class})
@RequiredArgsConstructor
public class SecurityConfig {

    public static final String SESSION_COOKIE_NAME = "patchats_session";

    private final ApiAuthenticationEntryPoint authenticationEntryPoint;

    /** Shapes the Spring Session cookie; picked up automatically by Spring Session's auto-configuration. */
    @Bean
    public DefaultCookieSerializer cookieSerializer(
            final AuthProperties authProperties, final SessionProperties sessionProperties) {
        final DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName(SESSION_COOKIE_NAME);
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(authProperties.isCookieSecure());
        serializer.setSameSite("Lax");
        serializer.setCookiePath("/");
        // Persistent cookie matching the server-side inactivity timeout (spring.session.timeout).
        final Duration timeout = sessionProperties.getTimeout();
        serializer.setCookieMaxAge((int) timeout.toSeconds());
        return serializer;
    }

    /** Shared by the filter chain (restore on request) and {@code AuthController} (save on login). */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    /**
     * Default/production chain.
     *
     * <p>NOTE: the admin role is not yet assigned anywhere, so the email rule still fails closed — every caller is
     * denied until an admin domain lands. Other endpoints keep their prior open posture.
     */
    @Bean
    @Profile("!dev")
    SecurityFilterChain securityFilterChain(final HttpSecurity http) throws Exception {
        return common(http)
                .authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/email/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/session")
                        .authenticated()
                        .anyRequest()
                        .permitAll())
                .build();
    }

    /** Local-dev chain: only the session endpoint needs auth so the login flow can be exercised end to end. */
    @Bean
    @Profile("dev")
    SecurityFilterChain devSecurityFilterChain(final HttpSecurity http) throws Exception {
        return common(http)
                .authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.GET, "/api/session")
                        .authenticated()
                        .anyRequest()
                        .permitAll())
                .build();
    }

    private HttpSecurity common(final HttpSecurity http) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .securityContext(context -> context.securityContextRepository(securityContextRepository()))
                .exceptionHandling(handling -> handling.authenticationEntryPoint(authenticationEntryPoint));
    }
}
