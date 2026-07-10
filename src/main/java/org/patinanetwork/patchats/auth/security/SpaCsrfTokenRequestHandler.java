package org.patinanetwork.patchats.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.function.Supplier;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

/**
 * The CSRF request handler for single-page apps, straight from the Spring Security reference. Two jobs:
 *
 * <ul>
 *   <li>{@link #handle} applies BREACH protection (XOR masking) to server-rendered token values and resolves the
 *       deferred token on every request, which makes {@code CookieCsrfTokenRepository} write the readable
 *       {@code XSRF-TOKEN} cookie the SPA echoes back.
 *   <li>{@link #resolveCsrfTokenValue} accepts the raw (unmasked) value when it arrives via the {@code X-XSRF-TOKEN}
 *       header — the SPA copies the cookie verbatim — while still unmasking values submitted as request parameters.
 * </ul>
 */
final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(
            final HttpServletRequest request, final HttpServletResponse response, final Supplier<CsrfToken> csrfToken) {
        this.xor.handle(request, response, csrfToken);
        // Resolve the deferred token so the repository writes the XSRF-TOKEN cookie on this response.
        csrfToken.get();
    }

    @Override
    public String resolveCsrfTokenValue(final HttpServletRequest request, final CsrfToken csrfToken) {
        final String headerValue = request.getHeader(csrfToken.getHeaderName());
        return (StringUtils.hasText(headerValue) ? this.plain : this.xor).resolveCsrfTokenValue(request, csrfToken);
    }
}
