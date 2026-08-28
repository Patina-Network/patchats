package org.patinanetwork.patchats.auth;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.auth.TokenGenerator.GeneratedToken;
import org.patinanetwork.patchats.auth.repo.MagicLinkTokenRepo;
import org.patinanetwork.patchats.utilities.EmailNormalizer;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the magic-link flow: issuing links (request) and exchanging them for a member (verify). Magic links only
 * sign in existing members — the sign-up form is the sole creator of member rows — so requesting a link for an
 * unregistered email is an error (404), not a silent no-op.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final MagicLinkTokenRepo tokens;
    private final MemberRepo members;
    private final TokenGenerator tokenGenerator;
    private final MagicLinkEmailComposer emailComposer;
    private final RequestLinkRateLimiter rateLimiter;
    private final AuthProperties properties;
    private final Clock clock;

    /**
     * Issues a fresh single-use link. Previously issued links are deliberately left alone — each stays valid until it
     * is used or expires, so a member who asks for a second link and then clicks the first email is not sent to a dead
     * end. How many can be outstanding at once is bounded by the rate limiter, not by invalidation. An unregistered
     * email is rejected outright so the login page can point the visitor at the sign-up form instead of leaving them
     * waiting on an email that will never arrive.
     *
     * <p>The limiter runs <em>before</em> the member-existence check, deliberately: a 429 therefore says nothing about
     * whether the address has an account, and it is the throttle that keeps the 404 from being a cheap way to farm
     * membership. Keep that ordering.
     *
     * @throws TooManyLinkRequestsException when the per-email or per-IP budget is exhausted
     * @throws UnregisteredEmailException when no member row exists for the email
     */
    public void requestLink(final String rawEmail, final String clientIp) {
        final String email = EmailNormalizer.normalize(rawEmail);
        if (!rateLimiter.tryAcquire(email, clientIp)) {
            log.warn("Rate-limited magic-link request for {} from {}", email, clientIp);
            throw new TooManyLinkRequestsException();
        }
        if (members.getMemberByEmail(email).isEmpty()) {
            log.debug("Rejecting magic-link request for unregistered email {}", email);
            throw new UnregisteredEmailException();
        }
        final GeneratedToken token = tokenGenerator.generate();
        tokens.insertToken(email, token.hash(), clock.instant().plus(properties.getMagicLinkTtl()));
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
}
