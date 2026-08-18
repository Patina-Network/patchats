package org.patinanetwork.patchats.email;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Single-thread executor backing {@link EmailDrainer}. Core = max = 1 so drains serialise and overlapping triggers
 * coalesce onto one drain (decision #6). Waits for an in-flight drain on shutdown so a stop-then-start deploy does not
 * strand a claimed batch (decision #5).
 */
@Configuration
public class EmailExecutorConfig {

    @Bean
    public ThreadPoolTaskExecutor emailDrainExecutor() {
        final ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        // A tiny queue is enough: the drainer coalesces triggers itself, so at most one job is ever queued.
        executor.setQueueCapacity(1);
        executor.setThreadNamePrefix("email-drain-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
