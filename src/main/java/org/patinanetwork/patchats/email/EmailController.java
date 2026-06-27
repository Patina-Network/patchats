package org.patinanetwork.patchats.email;

import io.micrometer.core.annotation.Timed;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.patinanetwork.patchats.email.dto.PreviewEmailResponse;
import org.patinanetwork.patchats.email.dto.SendEmailRequest;
import org.patinanetwork.patchats.email.dto.SendEmailResponse;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST endpoints for sending templated plain-text emails. */
@RestController
@RequestMapping("/api/email")
@Tag(name = "Email")
@Timed(value = "controller.execution")
@EnableConfigurationProperties(EmailProperties.class)
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @Operation(summary = "Send one or more templated plain-text emails")
    @PostMapping("/send")
    public ResponseEntity<ApiResponder<SendEmailResponse>> send(@Valid @RequestBody final SendEmailRequest request) {
        final SendEmailResponse response = emailService.send(request);
        final String message = "Sent %d of %d emails".formatted(response.sent(), response.sent() + response.failed());
        return ResponseEntity.ok(ApiResponder.success(message, response));
    }

    @Operation(summary = "Render templated emails without sending them")
    @PostMapping("/preview")
    public ResponseEntity<ApiResponder<PreviewEmailResponse>> preview(
            @Valid @RequestBody final SendEmailRequest request) {
        final PreviewEmailResponse response = emailService.preview(request);
        return ResponseEntity.ok(ApiResponder.success(
                "Rendered %d emails".formatted(response.previews().size()), response));
    }
}
