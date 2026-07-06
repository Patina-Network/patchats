package org.patinanetwork.patchats.auth.security;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.auth.AuthController;
import org.patinanetwork.patchats.auth.AuthService;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Exercises the default (non-dev) filter chain end to end with filters ON: anonymous rejection, programmatic login at
 * verify, session-carried authentication, and logout. Runs without Spring Session's JDBC store — the servlet mock
 * session stands in for it, which keeps the slice database-free while still proving the Spring Security wiring.
 */
@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, ApiAuthenticationEntryPoint.class, ApiExceptionHandler.class})
class SecurityWiringTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private MemberRepo members;

    @Test
    void sessionEndpointRejectsAnonymousWithJsonEnvelope() throws Exception {
        mockMvc.perform(get("/api/session"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Not signed in"));
    }

    @Test
    void requestLinkIsReachableAnonymously() throws Exception {
        mockMvc.perform(post("/api/auth/request-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ann@example.com\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void emailEndpointStaysAdminOnlyAndFailsClosed() throws Exception {
        mockMvc.perform(post("/api/email/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void stateChangingPostWithoutCsrfTokenIsForbidden() throws Exception {
        // Logout is not in the CSRF-exempt set: it consumes the session cookie, so it needs the token.
        mockMvc.perform(post("/api/auth/logout")).andExpect(status().isForbidden());
    }

    @Test
    void anonymousSignUpIsExemptFromCsrf() throws Exception {
        // A first-time visitor POSTing the sign-up form has no XSRF-TOKEN cookie yet, so requiring the token would
        // make sign-up impossible. MemberController is outside this slice, so the concrete status is incidental —
        // what matters is that CSRF did not reject it. See the exemption list in SecurityConfig.
        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> assertNotEquals(
                        HttpServletResponse.SC_FORBIDDEN,
                        result.getResponse().getStatus(),
                        "anonymous sign-up must not be blocked by CSRF"));
    }

    @Test
    void verifyEstablishesASessionThatAuthenticatesLaterRequests() throws Exception {
        final Member member = Member.builder()
                .id(UUID.randomUUID())
                .email("ann@example.com")
                .firstName("Ann")
                .lastName("Example")
                .build();
        when(authService.verify("raw-token")).thenReturn(member);
        when(members.getMemberByEmail(member.getEmail())).thenReturn(Optional.of(member));

        final MvcResult login = mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\"}"))
                .andExpect(status().isOk())
                .andReturn();
        final MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertNotNull(session, "verify must establish a session");

        mockMvc.perform(get("/api/session").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.payload.email").value("ann@example.com"))
                .andExpect(jsonPath("$.payload.name").value("Ann Example"));
    }

    @Test
    void logoutInvalidatesTheSession() throws Exception {
        final Member member = Member.builder()
                .id(UUID.randomUUID())
                .email("ann@example.com")
                .firstName("Ann")
                .lastName("Example")
                .build();
        when(authService.verify("raw-token")).thenReturn(member);

        final MvcResult login = mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\"}"))
                .andReturn();
        final MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertNotNull(session);

        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isOk());
        assertTrue(session.isInvalid());
    }
}
