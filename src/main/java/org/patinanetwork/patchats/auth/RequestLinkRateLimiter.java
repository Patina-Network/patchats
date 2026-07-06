package org.patinanetwork.patchats.auth;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import io.github.bucket4j.Bucket;
import java.time.Duration;
import org.springframework.stereotype.Component;

/**
 * Guards the request-link endpoint against inbox flooding: a small per-email budget plus a looser per-IP budget, both
 * refilling over a 15-minute window. Buckets live in memory (bounded by an expire-after-access cache), which is
 * per-instance and fine for the current single-node deployment; Bucket4j's distributed backends are the upgrade path if
 * that changes.
 */
@Component
public class RequestLinkRateLimiter {

    private static final int EMAIL_CAPACITY = 3;
    private static final int IP_CAPACITY = 10;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final LoadingCache<String, Bucket> emailBuckets = buckets(EMAIL_CAPACITY);
    private final LoadingCache<String, Bucket> ipBuckets = buckets(IP_CAPACITY);

    /**
     * Consumes one request from both budgets; permitted only when neither is exhausted. If the IP budget denies after
     * the email budget consumed, the email token is returned — a request blocked by one limit must not silently drain
     * the other.
     */
    public boolean tryAcquire(final String email, final String clientIp) {
        final Bucket emailBucket = emailBuckets.getUnchecked(email);
        final Bucket ipBucket = ipBuckets.getUnchecked(clientIp);
        if (!emailBucket.tryConsume(1)) {
            return false;
        }
        if (ipBucket.tryConsume(1)) {
            return true;
        }
        emailBucket.addTokens(1);
        return false;
    }

    private static LoadingCache<String, Bucket> buckets(final int capacity) {
        return CacheBuilder.newBuilder()
                .expireAfterAccess(WINDOW.multipliedBy(2))
                .build(CacheLoader.from(key -> Bucket.builder()
                        .addLimit(limit -> limit.capacity(capacity).refillGreedy(capacity, WINDOW))
                        .build()));
    }
}
