package org.patinanetwork.patchats.email;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.patinanetwork.patchats.email.dto.SendEmailResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EmailController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class EmailControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private EmailEnqueueService enqueueService;

    @MockitoBean
    private EmailProgressService progressService;

    @MockitoBean
    private EmailDrainer drainer;

    @MockitoBean
    private org.patinanetwork.patchats.email.db.repos.EmailTemplateRepo templateRepo;

    @Test
    void returnsOkAndApiResponderOnSuccess() throws Exception {
        when(emailService.send(any()))
                .thenReturn(new SendEmailResponse(
                        1, 0, List.of(new SendEmailResponse.MessageResult(List.of("a@x.com"), true, null))));

        mockMvc.perform(
                        post("/api/email/send")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"subject\":\"S\",\"body\":\"B\",\"messages\":[{\"recipients\":[{\"email\":\"a@x.com\"}]}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.payload.sent").value(1));
    }

    @Test
    void returnsBadRequestOnInvalidEmail() throws Exception {
        mockMvc.perform(
                        post("/api/email/send")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"subject\":\"S\",\"body\":\"B\",\"messages\":[{\"recipients\":[{\"email\":\"not-an-email\"}]}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
