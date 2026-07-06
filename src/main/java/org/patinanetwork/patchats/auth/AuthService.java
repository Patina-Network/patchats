package org.patinanetwork.patchats.auth;

import java.time.Clock;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.auth.TokenGenerator.GeneratedToken;
import org.patinanetwork.patchats.auth.repo.MagicLinkTokenRepository;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the magic-link flow: issuing links (request) and exchanging them for a member (verify). Magic links only
 * sign in existing members — the sign-up form is the sole creator of member rows — and requesting a link never leaks
 * whether an account exists.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final MagicLinkTokenRepository tokens;
    private final MemberRepo members;
    private final TokenGenerator tokenGenerator;
    private final MagicLinkEmailComposer emailComposer;
    private final RequestLinkRateLimiter rateLimiter;
    private final AuthProperties properties;
    private final Clock clock;

    /**
     * Issues a fresh single-use link and invalidates any outstanding ones for the email. Being rate-limited surfaces as
     * a visible 429 — the limiter runs <em>before</em> the member-existence check, so the 429 is registration-blind and
     * reveals nothing. Unregistered emails are skipped silently (the same generic success as a real send), so account
     * existence stays unobservable.
     *
     * @throws TooManyLinkRequestsException when the per-email or per-IP budget is exhausted
     */
    public void requestLink(final String rawEmail, final String clientIp) {
        final String email = normalize(rawEmail);
        if (!rateLimiter.tryAcquire(email, clientIp)) {
            log.warn("Rate-limited magic-link request for {} from {}", email, clientIp);
            throw new TooManyLinkRequestsException();
        }
        if (members.getMemberByEmail(email).isEmpty()) {
            log.info("Skipping magic-link request for unregistered email {}", email);
            return;
        }
        final GeneratedToken token = tokenGenerator.generate();
        tokens.deleteByEmail(email);
        tokens.insertToken(
                UUID.randomUUID(), email, token.hash(), clock.instant().plus(properties.getMagicLinkTtl()));
        emailComposer.send(email, token.raw());
    }

    /**
     * Atomically consumes the presented token and resolves the member behind it.
     *
     * @throws InvalidMagicLinkException when the token is unknown, already used, or expired — or when the member no
     *     longer exists (deleted between send and click); the message stays generic either way
     */
    public Member verify(final String rawToken) {
        final String email = tokens.consumeAndReturnEmail(TokenGenerator.hash(rawToken), clock.instant())
                .orElseThrow(InvalidMagicLinkException::new);
        return members.getMemberByEmail(email).orElseThrow(InvalidMagicLinkException::new);
    }

    /**
     * Lowercases and trims before any lookup or token write. {@code MemberRepo.getMemberByEmail} matches the column
     * exactly, so this is the single place email casing is reconciled — every path through this service must use it.
     */
    private static String normalize(final String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
