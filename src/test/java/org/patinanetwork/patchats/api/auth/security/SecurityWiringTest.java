package org.patinanetwork.patchats.api.auth.security;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.auth.AuthController;
import org.patinanetwork.patchats.api.auth.AuthService;
import org.patinanetwork.patchats.api.auth.repo.AdminRepo;
import org.patinanetwork.patchats.api.email.EmailController;
import org.patinanetwork.patchats.api.email.EmailDrainer;
import org.patinanetwork.patchats.api.email.EmailEnqueueService;
import org.patinanetwork.patchats.api.email.EmailProgressService;
import org.patinanetwork.patchats.api.email.EmailService;
import org.patinanetwork.patchats.api.email.TemplateManagementService;
import org.patinanetwork.patchats.api.email.db.repos.EmailTemplateRepo;
import org.patinanetwork.patchats.api.email.dto.SendEmailResponse;
import org.patinanetwork.patchats.api.match.MatchController;
import org.patinanetwork.patchats.api.match.MatchService;
import org.patinanetwork.patchats.api.member.MemberController;
import org.patinanetwork.patchats.api.member.MemberService;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberStatusRequest;
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
@WebMvcTest({AuthController.class, EmailController.class, MemberController.class, MatchController.class})
@Import({SecurityConfig.class, ApiAuthenticationEntryPoint.class, ApiExceptionHandler.class})
class SecurityWiringTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private MemberRepo members;

    @MockitoBean
    private AdminRepo admins;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private EmailEnqueueService enqueueService;

    @MockitoBean
    private EmailProgressService progressService;

    @MockitoBean
    private EmailDrainer drainer;

    @MockitoBean
    private EmailTemplateRepo templateRepo;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private TemplateManagementService templateManagementService;

    @MockitoBean
    private MatchService matchService;

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
    void emailEndpointRejectsAnonymousCallers() throws Exception {
        mockMvc.perform(post("/api/email/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void memberStatusEndpointStaysAdminOnlyAndFailsClosed() throws Exception {
        mockMvc.perform(patch("/api/members/admin/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}")
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
        when(memberService.createMember(any()))
                .thenReturn(MemberDto.builder()
                        .id(UUID.randomUUID())
                        .firstName("Ann")
                        .lastName("Example")
                        .email("ann@example.com")
                        .introduction("Hello")
                        .active(true)
                        .build());

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Ann",
                                  "lastName": "Example",
                                  "email": "ann@example.com",
                                  "introduction": "Hello"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payload.email").value("ann@example.com"));
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

    @Test
    void adminEndpointsAreForbiddenToASignedInNonAdmin() throws Exception {
        final MockHttpSession session = signIn(false);

        mockMvc.perform(post("/api/email/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/members").session(session)).andExpect(status().isForbidden());
    }

    @Test
    void adminEndpointsAdmitAMemberOnTheAllowlist() throws Exception {
        final MockHttpSession session = signIn(true);
        final UUID templateId = UUID.randomUUID();
        when(emailService.send(any()))
                .thenReturn(new SendEmailResponse(
                        1, 0, List.of(new SendEmailResponse.MessageResult(List.of("a@x.com"), true, null))));

        mockMvc.perform(post("/api/email/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                "{\"templateId\":\"" + templateId
                                        + "\",\"subject\":\"S\",\"body\":\"B\",\"messages\":[{\"recipients\":[{\"email\":\"a@x.com\"}]}]}")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void aMemberCanChangeTheirOwnStatusWithoutBeingAnAdmin() throws Exception {
        final Member member = aMember();
        final MockHttpSession session = signIn(member, false);
        when(memberService.updateMemberStatus(
                        new UpdateMemberStatusRequest(false, Optional.of("Moving abroad")), member.getId()))
                .thenReturn(MemberDto.builder()
                        .id(member.getId())
                        .active(false)
                        .deactivationReason("Moving abroad")
                        .build());

        mockMvc.perform(patch("/api/members/me/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false,\"deactivationReason\":\"Moving abroad\"}")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payload.active").value(false))
                .andExpect(jsonPath("$.payload.deactivationReason").value("Moving abroad"));
    }

    @Test
    void ownStatusEndpointRejectsAnonymousCallers() throws Exception {
        mockMvc.perform(patch("/api/members/me/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}")
                        .with(csrf()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verify(memberService, never()).updateMemberStatus(any(UpdateMemberStatusRequest.class), any(UUID.class));
    }

    @Test
    void ownStatusEndpointRequiresACsrfTokenEvenWhenSignedIn() throws Exception {
        final MockHttpSession session = signIn(false);

        mockMvc.perform(patch("/api/members/me/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}")
                        .session(session))
                .andExpect(status().isForbidden());

        verify(memberService, never()).updateMemberStatus(any(UpdateMemberStatusRequest.class), any(UUID.class));
    }

    @Test
    void aMemberCannotUseTheAdminStatusEndpoint() throws Exception {
        final MockHttpSession session = signIn(false);

        mockMvc.perform(patch("/api/members/admin/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        verify(memberService, never()).updateMemberStatus(any(UpdateMemberStatusRequest.class), any(UUID.class));
    }

    @Test
    void anAdminCanChangeAnotherMembersStatus() throws Exception {
        final MockHttpSession session = signIn(true);
        final UUID someoneElse = UUID.randomUUID();
        when(memberService.updateMemberStatus(new UpdateMemberStatusRequest(false, Optional.empty()), someoneElse))
                .thenReturn(MemberDto.builder().id(someoneElse).active(false).build());

        mockMvc.perform(patch("/api/members/admin/{id}/status", someoneElse)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payload.active").value(false));
    }

    @Test
    void matchEndpointsRejectAnonymousCallers() throws Exception {
        mockMvc.perform(get("/api/match")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/match/{id}", UUID.randomUUID())).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/match/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
        verify(matchService, never()).filterMatches(any());
    }

    @Test
    void matchEndpointsAreForbiddenToASignedInNonAdmin() throws Exception {
        final MockHttpSession session = signIn(false);

        mockMvc.perform(get("/api/match").session(session)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/match/{id}", UUID.randomUUID()).session(session))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/match")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/match/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isForbidden());
        verify(matchService, never()).filterMatches(any());
        verify(matchService, never()).createMatch(any());
    }

    @Test
    void matchEndpointsAdmitAnAdmin() throws Exception {
        final MockHttpSession session = signIn(true);
        when(matchService.filterMatches(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/match").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private static Member aMember() {
        return Member.builder()
                .id(UUID.randomUUID())
                .email("ann@example.com")
                .firstName("Ann")
                .lastName("Example")
                .build();
    }

    /** Completes a magic-link verification and returns the session it established. */
    private MockHttpSession signIn(final boolean isAdmin) throws Exception {
        return signIn(aMember(), isAdmin);
    }

    private MockHttpSession signIn(final Member member, final boolean isAdmin) throws Exception {
        when(authService.verify("raw-token")).thenReturn(member);
        when(admins.isAdmin(member.getEmail())).thenReturn(isAdmin);

        final MvcResult login = mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\"}"))
                .andExpect(status().isOk())
                .andReturn();
        final MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertNotNull(session, "verify must establish a session");
        return session;
    }
}
