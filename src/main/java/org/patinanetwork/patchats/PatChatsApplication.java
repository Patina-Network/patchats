package org.patinanetwork.patchats;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@Slf4j
public class PatChatsApplication {

    public static void main(final String[] args) {
        Thread.setDefaultUncaughtExceptionHandler(
                (thread, throwable) -> log.error("Uncaught exception in thread: {}", thread.getName(), throwable));

        SpringApplication.run(PatChatsApplication.class, args);
    }
}
