package org.patinanetwork.patchats.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Answers unauthenticated requests to protected endpoints with a 401 in the standard JSON envelope.
 *
 * <p>To protect an endpoint (i.e. make it trigger this entry point when no session cookie is presented), add a rule for
 * it in {@link SecurityConfig}'s {@code authorizeHttpRequests} block:
 *
 * <pre>{@code
 * .authorizeHttpRequests(auth -> auth
 *         .requestMatchers(HttpMethod.GET, "/api/matches/**").authenticated()  // members only
 *         .anyRequest().permitAll())
 * }</pre>
 *
 * The controller can then read the signed-in member via {@code @AuthenticationPrincipal AuthenticatedMember}.
 */
@Component
@RequiredArgsConstructor
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            final HttpServletRequest request,
            final HttpServletResponse response,
            final AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponder.failure("Not signed in"));
    }
}
