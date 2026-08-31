package org.patinanetwork.patchats.auth;

import io.micrometer.core.annotation.Timed;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.auth.dto.RequestLinkRequest;
import org.patinanetwork.patchats.auth.dto.SessionResponse;
import org.patinanetwork.patchats.auth.dto.VerifyRequest;
import org.patinanetwork.patchats.auth.repo.AdminRepo;
import org.patinanetwork.patchats.auth.security.AuthenticatedMember;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST endpoints for magic-link sign-in and the current session. */
@RestController
@RequestMapping("/api")
@Tag(name = "Auth")
@Timed(value = "controller.execution")
@EnableConfigurationProperties(AuthProperties.class)
@RequiredArgsConstructor
public class AuthController {

    /** Success copy for a link that was actually sent; an unregistered email fails with 404 instead. */
    private static final String GENERIC_REQUEST_MESSAGE = "Check your email for a sign-in link.";

    private static final GrantedAuthority MEMBER = new SimpleGrantedAuthority("ROLE_MEMBER");
    private static final GrantedAuthority ADMIN = new SimpleGrantedAuthority("ROLE_ADMIN");

    private final AuthService authService;
    private final MemberRepo members;
    private final AdminRepo admins;
    private final SecurityContextRepository securityContextRepository;

    @Operation(summary = "Email a single-use sign-in link")
    @PostMapping("/auth/request-link")
    public ResponseEntity<ApiResponder<Void>> requestLink(
            @Valid @RequestBody final RequestLinkRequest request, final HttpServletRequest httpRequest) {
        authService.requestLink(request.email(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponder.success(GENERIC_REQUEST_MESSAGE, null));
    }

    @Operation(summary = "Exchange a magic-link token for a session")
    @PostMapping("/auth/verify")
    public ResponseEntity<ApiResponder<SessionResponse>> verify(
            @Valid @RequestBody final VerifyRequest request,
            final HttpServletRequest httpRequest,
            final HttpServletResponse httpResponse) {
        final Member member = authService.verify(request.token());
        final boolean isAdmin = login(member, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponder.success("Signed in.", SessionResponse.of(member, isAdmin)));
    }

    /**
     * Reads the member fresh from the database so a deleted member is never served from stale session state; in that
     * case the session is torn down (row invalidated and the thread-local context cleared, so nothing later in this
     * request still sees an authenticated principal).
     *
     * <p>Looks up by email rather than id because {@code MemberRepo.getMemberById} is still
     * {@code UnsupportedOperationException} — switch to it once the member domain implements it. The email in the
     * principal is the value read straight off the member row at sign-in, so it matches exactly.
     */
    @Operation(summary = "The currently signed-in member")
    @GetMapping("/session")
    public ResponseEntity<ApiResponder<SessionResponse>> session(
            @AuthenticationPrincipal final AuthenticatedMember principal,
            final Authentication authentication,
            final HttpServletRequest httpRequest) {
        final boolean isAdmin = authentication.getAuthorities().contains(ADMIN);
        return members.getMemberByEmail(principal.email())
                .map(account ->
                        ResponseEntity.ok(ApiResponder.success("Signed in.", SessionResponse.of(account, isAdmin))))
                .orElseGet(() -> {
                    invalidateSession(httpRequest);
                    SecurityContextHolder.clearContext();
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponder.failure("Not signed in"));
                });
    }

    @Operation(summary = "Sign out")
    @PostMapping("/auth/logout")
    public ResponseEntity<ApiResponder<Void>> logout(final HttpServletRequest httpRequest) {
        invalidateSession(httpRequest);
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponder.success("Signed out.", null));
    }

    /**
     * Programmatic login: store the authenticated principal in the {@link SecurityContextRepository}, which Spring
     * Session persists and turns into the session cookie. {@code changeSessionId} rotates any pre-existing session so a
     * client-supplied id can never survive into an authenticated session (fixation defense).
     *
     * <p>The {@code admins} allowlist is consulted exactly once, here, and the result is carried for the life of the
     * session by the granted authorities (which Spring Session already serialises — nothing has to be added to
     * {@link AuthenticatedMember}). Allowlist edits therefore take effect at the member's next sign-in; revoking an
     * admin mid-session means deleting their {@code spring_session} rows as well.
     *
     * @return whether this session was granted {@code ROLE_ADMIN}
     */
    private boolean login(final Member member, final HttpServletRequest request, final HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        final boolean isAdmin = admins.isAdmin(member.getEmail());
        final List<GrantedAuthority> authorities = isAdmin ? List.of(MEMBER, ADMIN) : List.of(MEMBER);
        final SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(AuthenticatedMember.of(member), null, authorities));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
        return isAdmin;
    }

    private void invalidateSession(final HttpServletRequest request) {
        final HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
