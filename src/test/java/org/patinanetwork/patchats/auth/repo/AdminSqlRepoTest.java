package org.patinanetwork.patchats.auth.repo;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Locale;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AdminSqlRepoTest {

    private final AdminRepo adminRepo;
    private final JdbcClient jdbc;
    private String adminEmail;

    @Autowired
    AdminSqlRepoTest(final AdminRepo adminRepo, final JdbcClient jdbc) {
        this.adminRepo = adminRepo;
        this.jdbc = jdbc;
    }

    @BeforeEach
    void setUp() {
        adminEmail = "admin-repo-test-" + UUID.randomUUID() + "@example.com";
        jdbc.sql("INSERT INTO admins (email, note) VALUES (:email, :note)")
                .param("email", adminEmail)
                .param("note", "AdminSqlRepoTest fixture")
                .update();
    }

    @Test
    void isAdmin_returnsTrueWhenEmailIsAllowlisted() {
        assertTrue(adminRepo.isAdmin(adminEmail));
    }

    @Test
    void isAdmin_returnsFalseWhenEmailIsNotAllowlisted() {
        assertFalse(adminRepo.isAdmin("missing-admin-" + UUID.randomUUID() + "@example.com"));
    }

    @Test
    void isAdmin_returnsTrueWhenEmailRequiresNormalization() {
        final String unnormalizedEmail = " \t" + adminEmail.toUpperCase(Locale.ROOT) + "\r\n ";

        assertTrue(adminRepo.isAdmin(unnormalizedEmail));
    }
}
