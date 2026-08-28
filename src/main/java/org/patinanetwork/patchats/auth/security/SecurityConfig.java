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
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
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
 * <p><b>CSRF.</b> Double-submit protection via the Spring-documented SPA pattern: {@code CookieCsrfTokenRepository}
 * writes a JS-readable {@code XSRF-TOKEN} cookie on every response (see {@link SpaCsrfTokenRequestHandler}), and the
 * frontend echoes it back as an {@code X-XSRF-TOKEN} header on state-changing requests. This is defense-in-depth on top
 * of the {@code SameSite=Lax} session cookie and the JSON-only request bodies. Three anonymous endpoints are exempt —
 * {@code POST} of {@code auth/request-link}, {@code auth/verify}, and {@code members} (sign-up). None of them ride a
 * session (their only credential, if any, is in the body), and a first-time visitor has no {@code XSRF-TOKEN} cookie
 * yet, so requiring the token would block real sign-ins and sign-ups while protecting nothing. Each exemption is pinned
 * to {@code POST} so future authenticated verbs on those paths keep protection.
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
                        .requestMatchers(HttpMethod.GET, "/api/members")
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
        return http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                        .ignoringRequestMatchers(
                                PathPatternRequestMatcher.withDefaults()
                                        .matcher(HttpMethod.POST, "/api/auth/request-link"),
                                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/api/auth/verify"),
                                // Sign-up is anonymous: a first-time visitor has no XSRF-TOKEN cookie yet (the SPA is
                                // served by Vite in dev, so nothing has hit the backend), and there is no session to
                                // ride, so the token would block real sign-ups while protecting nothing. Scoped to
                                // POST only — the member domain's authenticated PATCH/DELETE must keep CSRF.
                                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/api/members")))
                .requestCache(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .securityContext(context -> context.securityContextRepository(securityContextRepository()))
                .exceptionHandling(handling -> handling.authenticationEntryPoint(authenticationEntryPoint));
    }
}
