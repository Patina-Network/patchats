package org.patinanetwork.patchats.email;

import io.micrometer.core.annotation.Timed;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.patinanetwork.patchats.email.db.models.EmailSource;
import org.patinanetwork.patchats.email.db.repos.EmailTemplateRepo;
import org.patinanetwork.patchats.email.dto.CreateTemplateRequest;
import org.patinanetwork.patchats.email.dto.EmailProgressResponse;
import org.patinanetwork.patchats.email.dto.EmailRequestSummary;
import org.patinanetwork.patchats.email.dto.EmailTemplateResponse;
import org.patinanetwork.patchats.email.dto.EnqueueEmailRequest;
import org.patinanetwork.patchats.email.dto.EnqueueEmailResponse;
import org.patinanetwork.patchats.email.dto.PreviewEmailResponse;
import org.patinanetwork.patchats.email.dto.PreviewTemplateRequest;
import org.patinanetwork.patchats.email.dto.SendEmailRequest;
import org.patinanetwork.patchats.email.dto.SendEmailResponse;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** REST endpoints for sending templated plain-text emails (sync legacy path + async outbox pipeline). */
@RestController
@RequestMapping("/api/email")
@Tag(name = "Email")
@Timed(value = "controller.execution")
@EnableConfigurationProperties(EmailProperties.class)
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;
    private final EmailEnqueueService enqueueService;
    private final EmailProgressService progressService;
    private final EmailDrainer drainer;
    private final EmailTemplateRepo templateRepo;
    private final TemplateManagementService templateManagementService;

    @Operation(summary = "Send one or more templated plain-text emails (synchronous, legacy)")
    @PostMapping("/send")
    public ResponseEntity<ApiResponder<SendEmailResponse>> send(@Valid @RequestBody final SendEmailRequest request) {
        final SendEmailResponse response = emailService.send(request);
        final String message = "Sent %d of %d emails".formatted(response.sent(), response.sent() + response.failed());
        return ResponseEntity.ok(ApiResponder.success(message, response));
    }

    @Operation(summary = "Enqueue an async send; a background runner delivers each message")
    @PostMapping("/send/async")
    public ResponseEntity<ApiResponder<EnqueueEmailResponse>> sendAsync(
            @Valid @RequestBody final EnqueueEmailRequest request) {
        final EnqueueEmailResponse response = enqueueService.enqueue(request, EmailSource.MANUAL);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponder.success("Accepted %d emails".formatted(response.accepted()), response));
    }

    @Operation(summary = "Kick the background runner to drain any pending emails now")
    @PostMapping("/process")
    public ResponseEntity<ApiResponder<Void>> process() {
        drainer.trigger();
        return ResponseEntity.accepted().body(ApiResponder.success("Drain triggered", null));
    }

    @Operation(summary = "List the available email templates")
    @GetMapping("/templates")
    public ResponseEntity<ApiResponder<List<EmailTemplateResponse>>> listTemplates() {
        final List<EmailTemplateResponse> templates =
                templateRepo.findAll().stream().map(EmailTemplateResponse::from).toList();
        return ResponseEntity.ok(ApiResponder.success("Found %d templates".formatted(templates.size()), templates));
    }

    @Operation(summary = "Create a new email template (Increment 5)")
    @PostMapping("/templates")
    public ResponseEntity<ApiResponder<EmailTemplateResponse>> createTemplate(
            @Valid @RequestBody final CreateTemplateRequest request) {
        final UUID templateId = templateManagementService.createTemplate(request);
        final EmailTemplateResponse response = templateRepo
                .findById(templateId)
                .map(EmailTemplateResponse::from)
                .orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponder.success("Template created: %s".formatted(request.name()), response));
    }

    @Operation(summary = "Delete an email template by ID (Increment 5)")
    @DeleteMapping("/templates/{id}")
    public ResponseEntity<ApiResponder<Void>> deleteTemplate(@PathVariable final UUID id) {
        templateManagementService.deleteTemplate(id);
        return ResponseEntity.accepted().body(ApiResponder.success("Template deleted: %s".formatted(id), null));
    }

    @Operation(summary = "Live progress of one batch: per-status counts and the per-email rows")
    @GetMapping("/progress")
    public ResponseEntity<ApiResponder<EmailProgressResponse>> progress(@RequestParam final UUID requestId) {
        final EmailProgressResponse response = progressService.progress(requestId);
        return ResponseEntity.ok(ApiResponder.success("Progress for %s".formatted(requestId), response));
    }

    @Operation(summary = "History of past sending sessions, newest first")
    @GetMapping("/requests")
    public ResponseEntity<ApiResponder<List<EmailRequestSummary>>> requests() {
        final List<EmailRequestSummary> history = progressService.history();
        return ResponseEntity.ok(ApiResponder.success("Found %d sessions".formatted(history.size()), history));
    }

    @Operation(summary = "Re-queue a failed (ERROR) email and kick the runner to send it")
    @PostMapping("/{emailId}/resend")
    public ResponseEntity<ApiResponder<Void>> resend(@PathVariable final UUID emailId) {
        progressService.resend(emailId);
        return ResponseEntity.accepted().body(ApiResponder.success("Re-queued %s".formatted(emailId), null));
    }

    @Operation(summary = "Render a stored template against messages without sending them")
    @PostMapping("/preview")
    public ResponseEntity<ApiResponder<PreviewEmailResponse>> preview(
            @Valid @RequestBody final PreviewTemplateRequest request) {
        final PreviewEmailResponse response = enqueueService.preview(request);
        return ResponseEntity.ok(ApiResponder.success(
                "Rendered %d emails".formatted(response.previews().size()), response));
    }

    @Operation(summary = "Render caller-supplied subject/body templates without sending (synchronous, legacy)")
    @PostMapping("/preview/legacy")
    public ResponseEntity<ApiResponder<PreviewEmailResponse>> previewLegacy(
            @Valid @RequestBody final SendEmailRequest request) {
        final PreviewEmailResponse response = emailService.preview(request);
        return ResponseEntity.ok(ApiResponder.success(
                "Rendered %d emails".formatted(response.previews().size()), response));
    }
}
