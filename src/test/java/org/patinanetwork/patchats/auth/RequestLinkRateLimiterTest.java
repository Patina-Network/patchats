package org.patinanetwork.patchats.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RequestLinkRateLimiterTest {

    private final RequestLinkRateLimiter rateLimiter = new RequestLinkRateLimiter();

    @Test
    void allowsThreeRequestsPerEmailThenDenies() {
        for (int i = 0; i < 3; i++) {
            assertTrue(rateLimiter.tryAcquire("ann@example.com", "10.0.0.1"), "request " + (i + 1));
        }
        assertFalse(rateLimiter.tryAcquire("ann@example.com", "10.0.0.1"));
    }

    @Test
    void emailBudgetsAreIndependent() {
        for (int i = 0; i < 3; i++) {
            rateLimiter.tryAcquire("ann@example.com", "10.0.0.1");
        }
        assertTrue(rateLimiter.tryAcquire("bob@example.com", "10.0.0.2"));
    }

    @Test
    void capsRequestsPerIpAcrossEmails() {
        for (int i = 0; i < 10; i++) {
            assertTrue(rateLimiter.tryAcquire("user" + i + "@example.com", "10.0.0.9"), "request " + (i + 1));
        }
        assertFalse(rateLimiter.tryAcquire("user10@example.com", "10.0.0.9"));
    }

    @Test
    void ipDenialDoesNotBurnTheEmailBudget() {
        // Exhaust the IP budget using other emails.
        for (int i = 0; i < 10; i++) {
            rateLimiter.tryAcquire("user" + i + "@example.com", "10.0.0.9");
        }
        // Denied by IP — but ann's email budget must be untouched...
        assertFalse(rateLimiter.tryAcquire("ann@example.com", "10.0.0.9"));
        // ...so all 3 of her requests still succeed from a fresh IP.
        for (int i = 0; i < 3; i++) {
            assertTrue(rateLimiter.tryAcquire("ann@example.com", "10.0.0.1"), "request " + (i + 1));
        }
    }
}
