package org.patinanetwork.patchats.email;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.patinanetwork.patchats.email.db.models.EmailTemplate;
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

    @MockitoBean
    private TemplateManagementService templateManagementService;

    @Test
    void returnsOkAndApiResponderOnSuccess() throws Exception {
        final UUID templateId = UUID.randomUUID();
        when(emailService.send(any()))
                .thenReturn(new SendEmailResponse(
                        1, 0, List.of(new SendEmailResponse.MessageResult(List.of("a@x.com"), true, null))));

        mockMvc.perform(
                        post("/api/email/send")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"templateId\":\"" + templateId
                                                + "\",\"subject\":\"S\",\"body\":\"B\",\"messages\":[{\"recipients\":[{\"email\":\"a@x.com\"}]}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.payload.sent").value(1));
    }

    @Test
    void returnsBadRequestOnInvalidEmail() throws Exception {
        final UUID templateId = UUID.randomUUID();
        mockMvc.perform(
                        post("/api/email/send")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"templateId\":\"" + templateId
                                                + "\",\"subject\":\"S\",\"body\":\"B\",\"messages\":[{\"recipients\":[{\"email\":\"not-an-email\"}]}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void createTemplateReturnsCreatedTemplate() throws Exception {
        final UUID templateId = UUID.randomUUID();
        when(templateManagementService.createTemplate(any())).thenReturn(templateId);
        when(templateRepo.findById(templateId))
                .thenReturn(Optional.of(EmailTemplate.builder()
                        .id(templateId)
                        .name("Welcome")
                        .subject("Hi ${per1.name}")
                        .body("Body")
                        .createdAt(Instant.EPOCH)
                        .build()));

        mockMvc.perform(post("/api/email/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Welcome\",\"subject\":\"Hi ${per1.name}\",\"body\":\"Body\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.payload.name").value("Welcome"));
    }

    @Test
    void createTemplateReturnsBadRequestOnBlankName() throws Exception {
        mockMvc.perform(post("/api/email/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"subject\":\"S\",\"body\":\"B\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void deleteTemplateReturnsAccepted() throws Exception {
        mockMvc.perform(delete("/api/email/templates/{id}", UUID.randomUUID()))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true));
    }
}
