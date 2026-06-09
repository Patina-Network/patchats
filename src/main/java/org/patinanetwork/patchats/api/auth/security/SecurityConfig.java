package org.patinanetwork.patchats.api.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    /**
     * Default/production chain. Sending email is admin-only.
     *
     * <p>NOTE: authentication (OAuth2 login / roles) is not yet wired, so this rule currently fails closed — every
     * caller is denied because no security context is populated. Once the auth domain authenticates admins, the rule
     * begins to discriminate admins from other users. Other endpoints remain open for now, matching prior behaviour.
     */
    @Bean
    @Profile("!dev")
    SecurityFilterChain securityFilterChain(final HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/email/**")
                        .hasRole("ADMIN")
                        .anyRequest()
                        .permitAll())
                .build();
    }

    /** Local-dev chain: everything is permitted so the email endpoint can be exercised without auth. */
    @Bean
    @Profile("dev")
    SecurityFilterChain devSecurityFilterChain(final HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }
}
