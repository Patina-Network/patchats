package org.patinanetwork.patchats.auth;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.patinanetwork.patchats.auth.repo.MagicLinkTokenRepo;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sweeps expired magic-link rows, the counterpart to Spring Session's built-in cleanup of {@code spring_session}.
 * Issuing a link never deletes anything, so without this the table would grow forever.
 *
 * <p>Unguarded by any distributed lock: the deployment is single-node (see {@link RequestLinkRateLimiter}), and the
 * DELETE is idempotent anyway if that ever changes.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MagicLinkTokenCleanup {

    private final MagicLinkTokenRepo tokens;
    private final Clock clock;

    /**
     * Failures are logged rather than rethrown: an unhandled exception would cancel all future runs of a
     * {@code fixedDelay} schedule, turning one bad sweep into a permanent one.
     */
    @Scheduled(
            fixedDelayString = "${app.auth.token-cleanup-interval:1h}",
            initialDelayString = "${app.auth.token-cleanup-interval:1h}")
    public void purgeExpiredTokens() {
        try {
            final int removed = tokens.deleteExpired(clock.instant());
            log.debug("Purged {} expired magic-link token(s)", removed);
        } catch (final RuntimeException e) {
            log.error("Failed to purge expired magic-link tokens; will retry next interval", e);
        }
    }
}
