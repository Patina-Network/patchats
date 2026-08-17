package org.patinanetwork.patchats.auth;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.auth.repo.MagicLinkTokenRepo;

class MagicLinkTokenCleanupTest {

    private static final Instant NOW = Instant.parse("2026-07-03T12:00:00Z");

    private final MagicLinkTokenRepo tokens = mock(MagicLinkTokenRepo.class);

    private final MagicLinkTokenCleanup cleanup = new MagicLinkTokenCleanup(tokens, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void purgeDeletesEverythingExpiredAsOfNow() {
        when(tokens.deleteExpired(NOW)).thenReturn(3);

        cleanup.purgeExpiredTokens();

        verify(tokens).deleteExpired(NOW);
    }

    @Test
    void purgeSwallowsFailuresSoTheScheduleSurvives() {
        when(tokens.deleteExpired(NOW)).thenThrow(new IllegalStateException("connection reset"));

        // A thrown exception would cancel every future run of the fixed-delay schedule.
        assertDoesNotThrow(cleanup::purgeExpiredTokens);
    }
}
