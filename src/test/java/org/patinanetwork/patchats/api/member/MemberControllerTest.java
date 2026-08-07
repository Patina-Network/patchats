package org.patinanetwork.patchats.api.member;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.MemberDto;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.patinanetwork.patchats.common.web.exception.MemberDuplicateException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MemberController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class MemberControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MemberService memberService;

    @Test
    void createMember_ReturnsOkAndMemberDto() throws Exception {
        final CreateMemberRequest request = new CreateMemberRequest(
                "John",
                "Doe",
                "john.doe@example.com",
                "https://www.linkedin.com/in/johndoe",
                "Hello, I'm John!",
                "Friend",
                "Mentor - I am looking for guidance from someone with more experience",
                "Technology",
                "Software Engineer",
                "College, Career Development",
                "I want to be meet someone in person in NYC");

        when(memberService.createMember(any()))
                .thenReturn(MemberDto.builder()
                        .id(UUID.randomUUID())
                        .firstName(request.firstName())
                        .lastName(request.lastName())
                        .email(request.email())
                        .linkedInUrl(request.linkedInUrl())
                        .introduction(request.introduction())
                        .referralSource(request.referralSource())
                        .active(true)
                        .matchPref(request.matchPref())
                        .industryPref(request.industryPref())
                        .rolePref(request.rolePref())
                        .topics(request.topics())
                        .extraNotes(request.extraNotes())
                        .build());
        mockMvc.perform(
                        post("/api/members")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john.doe@example.com\",\"linkedInUrl\":\"https://www.linkedin.com/in/johndoe\",\"introduction\":\"Hello, I'm John!\",\"referralSource\":\"Friend\",\"matchPref\":\"Mentor - I am looking for guidance from someone with more experience\",\"industryPref\":\"Technology\",\"rolePref\":\"Software Engineer\",\"topics\":\"College, Career Development\",\"extraNotes\":\"I want to be meet someone in person in NYC\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.payload.firstName").value(request.firstName()))
                .andExpect(jsonPath("$.payload.lastName").value(request.lastName()))
                .andExpect(jsonPath("$.payload.email").value(request.email()))
                .andExpect(jsonPath("$.payload.linkedInUrl").value(request.linkedInUrl()))
                .andExpect(jsonPath("$.payload.introduction").value(request.introduction()))
                .andExpect(jsonPath("$.payload.referralSource").value(request.referralSource()))
                .andExpect(jsonPath("$.payload.matchPref").value(request.matchPref()))
                .andExpect(jsonPath("$.payload.industryPref").value(request.industryPref()))
                .andExpect(jsonPath("$.payload.rolePref").value(request.rolePref()))
                .andExpect(jsonPath("$.payload.topics").value(request.topics()))
                .andExpect(jsonPath("$.payload.extraNotes").value(request.extraNotes()))
                .andExpect(jsonPath("$.payload.id").isNotEmpty())
                .andExpect(jsonPath("$.payload.active").value(true));
    }

    @Test
    void createMember_returnsBadRequestWhenFirstNameIsBlank() throws Exception {
        mockMvc.perform(
                        post("/api/members")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"firstName\":\"\",\"lastName\":\"Doe\",\"email\":\"john.doe@example.com\",\"linkedInUrl\":\"https://www.linkedin.com/in/johndoe\",\"introduction\":\"Hello, I'm John!\",\"referralSource\":\"Friend\",\"matchPref\":\"Mentor - I am looking for guidance from someone with more experience\",\"industryPref\":\"Technology\",\"rolePref\":\"Software Engineer\",\"topics\":\"College, Career Development\",\"extraNotes\":\"I want to be meet someone in person in NYC\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void createMember_returnsConflictOnDuplicateEmail() throws Exception {
        when(memberService.createMember(any())).thenThrow(new MemberDuplicateException("john.doe@example.com"));
        mockMvc.perform(
                        post("/api/members")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john.doe@example.com\",\"linkedInUrl\":\"https://www.linkedin.com/in/johndoe\",\"introduction\":\"Hello, I'm John!\",\"referralSource\":\"Friend\",\"matchPref\":\"Mentor - I am looking for guidance from someone with more experience\",\"industryPref\":\"Technology\",\"rolePref\":\"Software Engineer\",\"topics\":\"College, Career Development\",\"extraNotes\":\"I want to be meet someone in person in NYC\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }
}
