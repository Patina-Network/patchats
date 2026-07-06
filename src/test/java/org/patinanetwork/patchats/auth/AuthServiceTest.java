package org.patinanetwork.patchats.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.auth.repo.MagicLinkTokenRepository;

class AuthServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-03T12:00:00Z");

    private final MagicLinkTokenRepository tokens = mock(MagicLinkTokenRepository.class);
    private final MemberRepo members = mock(MemberRepo.class);
    private final MagicLinkEmailComposer emailComposer = mock(MagicLinkEmailComposer.class);
    private final RequestLinkRateLimiter rateLimiter = mock(RequestLinkRateLimiter.class);
    private final AuthProperties properties = new AuthProperties();

    private AuthService authService;

    @BeforeEach
    void setUp() {
        properties.setBaseUrl("http://localhost:5173");
        authService = new AuthService(
                tokens,
                members,
                new TokenGenerator(),
                emailComposer,
                rateLimiter,
                properties,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void requestLinkNormalizesEmailAndStoresHashNotRaw() {
        when(rateLimiter.tryAcquire(anyString(), anyString())).thenReturn(true);
        when(members.getMemberByEmail("ann@example.com")).thenReturn(Optional.of(member("ann@example.com")));

        authService.requestLink("  Ann@Example.COM ", "10.0.0.1");

        verify(tokens).deleteByEmail("ann@example.com");
        final ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
        final ArgumentCaptor<Instant> expiry = ArgumentCaptor.forClass(Instant.class);
        verify(tokens).insertToken(any(UUID.class), eq("ann@example.com"), hash.capture(), expiry.capture());
        final ArgumentCaptor<String> raw = ArgumentCaptor.forClass(String.class);
        verify(emailComposer).send(eq("ann@example.com"), raw.capture());

        // The emailed value and the stored value must differ, and the stored one is the SHA-256 of the raw.
        assertNotEquals(raw.getValue(), hash.getValue());
        assertEquals(TokenGenerator.hash(raw.getValue()), hash.getValue());
        assertEquals(NOW.plus(properties.getMagicLinkTtl()), expiry.getValue());
    }

    @Test
    void requestLinkSurfacesRateLimitAs429() {
        when(rateLimiter.tryAcquire(anyString(), anyString())).thenReturn(false);

        assertThrows(TooManyLinkRequestsException.class, () -> authService.requestLink("ann@example.com", "10.0.0.1"));

        verifyNoInteractions(tokens, emailComposer);
    }

    @Test
    void requestLinkSkipsUnregisteredEmailSilently() {
        when(rateLimiter.tryAcquire(anyString(), anyString())).thenReturn(true);
        when(members.getMemberByEmail("stranger@example.com")).thenReturn(Optional.empty());

        authService.requestLink("stranger@example.com", "10.0.0.1");

        verifyNoInteractions(tokens, emailComposer);
    }

    @Test
    void verifyRejectsUnknownOrSpentToken() {
        when(tokens.consumeAndReturnEmail(anyString(), any())).thenReturn(Optional.empty());

        assertThrows(InvalidMagicLinkException.class, () -> authService.verify("bogus"));
    }

    @Test
    void verifyReturnsTheMemberBehindTheToken() {
        final Member existing = member("ann@example.com");
        when(tokens.consumeAndReturnEmail(TokenGenerator.hash("raw-token"), NOW))
                .thenReturn(Optional.of("ann@example.com"));
        when(members.getMemberByEmail("ann@example.com")).thenReturn(Optional.of(existing));

        assertEquals(existing, authService.verify("raw-token"));
    }

    @Test
    void verifyRejectsTokenWhoseMemberNoLongerExists() {
        when(tokens.consumeAndReturnEmail(TokenGenerator.hash("raw-token"), NOW))
                .thenReturn(Optional.of("gone@example.com"));
        when(members.getMemberByEmail("gone@example.com")).thenReturn(Optional.empty());

        assertThrows(InvalidMagicLinkException.class, () -> authService.verify("raw-token"));
    }

    private static Member member(final String email) {
        return Member.builder()
                .id(UUID.randomUUID())
                .email(email)
                .firstName("Ann")
                .lastName("Example")
                .build();
    }
}
