package org.patinanetwork.patchats.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.api.member.db.repos.MemberRepo;
import org.patinanetwork.patchats.auth.repo.AdminRepo;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private MemberRepo members;

    @MockitoBean
    private AdminRepo admins;

    @MockitoBean
    private SecurityContextRepository securityContextRepository;

    @Test
    void requestLinkAlwaysReturnsGenericMessage() throws Exception {
        mockMvc.perform(post("/api/auth/request-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ann@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Check your email for a sign-in link."));

        verify(authService).requestLink(eq("ann@example.com"), anyString());
    }

    @Test
    void requestLinkMapsUnregisteredEmailToNotFoundEnvelope() throws Exception {
        doThrow(new UnregisteredEmailException())
                .when(authService)
                .requestLink(eq("stranger@example.com"), anyString());

        mockMvc.perform(post("/api/auth/request-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"stranger@example.com\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("We couldn't find an account for that email."));
    }

    @Test
    void requestLinkRejectsMalformedEmail() throws Exception {
        mockMvc.perform(post("/api/auth/request-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void verifyReturnsSessionPayloadAndSavesContext() throws Exception {
        when(authService.verify("raw-token")).thenReturn(ann());
        when(admins.isAdmin("ann@example.com")).thenReturn(false);

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.payload.email").value("ann@example.com"))
                .andExpect(jsonPath("$.payload.name").value("Ann Example"))
                .andExpect(jsonPath("$.payload.isAdmin").value(false));

        verify(securityContextRepository).saveContext(any(), any(), any());
    }

    @Test
    void verifyFlagsAnAllowlistedMemberAsAdmin() throws Exception {
        when(authService.verify("raw-token")).thenReturn(ann());
        when(admins.isAdmin("ann@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payload.isAdmin").value(true));
    }

    private static Member ann() {
        return Member.builder()
                .id(UUID.randomUUID())
                .email("ann@example.com")
                .firstName("Ann")
                .lastName("Example")
                .build();
    }

    @Test
    void verifyMapsInvalidTokenToBadRequestEnvelope() throws Exception {
        when(authService.verify("spent")).thenThrow(new InvalidMagicLinkException());

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"spent\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(
                        jsonPath("$.message").value("This sign-in link is invalid or has expired. Request a new one."));
    }

    @Test
    void logoutIsIdempotent() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Signed out."));
    }
}
