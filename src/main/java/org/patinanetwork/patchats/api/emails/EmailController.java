package org.patinanetwork.patchats.api.emails;

import io.micrometer.core.annotation.Timed;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.patinanetwork.patchats.common.email.EmailClient;
import org.patinanetwork.patchats.common.email.options.SendEmailOptions;
import org.patinanetwork.patchats.common.email.template.ReactEmailTemplater;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Receives CSV-parsed payloads from the admin frontend (see {@code js/src/app/user/admin/emails/parseCSV.ts}) and sends
 * the corresponding emails by rendering a React Email template then dispatching it through the {@link EmailClient}.
 */
@RestController
@RequestMapping("/api/emails")
@Tag(name = "Email sending")
@Timed(value = "controller.execution")
public class EmailController {

    // TODO - These are placeholders. The example template is a "verify email" template; user/pairing emails likely
    //  need their own templates and a real verify URL / support address sourced from configuration.
    private static final String SUPPORT_EMAIL = "patchats@patinanetwork.org";
    private static final String VERIFY_URL = "https://patchats.org/verify";

    private final ReactEmailTemplater templater;
    private final EmailClient emailClient;

    public EmailController(final ReactEmailTemplater templater, final EmailClient emailClient) {
        this.templater = templater;
        this.emailClient = emailClient;
    }

    @Operation(summary = "Send an email to each user parsed from the uploaded users CSV")
    @PostMapping("/send-users")
    public ResponseEntity<ApiResponder<SendResult>> sendUsers(@RequestBody final Map<String, UserDto> users) {
        final SendResult result = new SendResult();
        for (final UserDto user : users.values()) {
            try {
                final String html = templater.createExampleTemplate(user.name(), VERIFY_URL, SUPPORT_EMAIL);
                send(user.email(), "Welcome to PatChats", html, result);
            } catch (final Exception e) {
                result.fail(user.email(), e);
            }
        }
        return ResponseEntity.ok().body(ApiResponder.success("Processed user emails", result));
    }

    @Operation(summary = "Send an email to both members of each pairing parsed from the uploaded pairings CSV")
    @PostMapping("/send-pairings")
    public ResponseEntity<ApiResponder<SendResult>> sendPairings(@RequestBody final List<PairDto> pairs) {
        final SendResult result = new SendResult();
        for (final PairDto pair : pairs) {
            sendPairingMember(pair.fullNameA(), pair.emailA(), result);
            sendPairingMember(pair.fullNameB(), pair.emailB(), result);
        }
        return ResponseEntity.ok().body(ApiResponder.success("Processed pairing emails", result));
    }

    private void sendPairingMember(final String name, final String email, final SendResult result) {
        try {
            // TODO - Reusing the example template; swap for a dedicated pairing-notification template.
            final String html = templater.createExampleTemplate(name, VERIFY_URL, SUPPORT_EMAIL);
            send(email, "Your PatChats pairing", html, result);
        } catch (final Exception e) {
            result.fail(email, e);
        }
    }

    private void send(final String recipientEmail, final String subject, final String html, final SendResult result)
            throws Exception {
        emailClient.sendMessage(SendEmailOptions.builder()
                .recipientEmail(recipientEmail)
                .subject(subject)
                .body(html)
                .build());
        result.succeed();
    }

    /** Summary of a batch send so the frontend can report how many emails went out. */
    public static final class SendResult {
        private int sent = 0;
        private final List<String> errors = new ArrayList<>();

        void succeed() {
            sent++;
        }

        void fail(final String email, final Exception e) {
            errors.add(email + ": " + e.getMessage());
        }

        public int getSent() {
            return sent;
        }

        public int getFailed() {
            return errors.size();
        }

        public List<String> getErrors() {
            return errors;
        }
    }

    /** Mirrors the {@code User} interface serialized by parseCSV.ts. */
    public record UserDto(
            String name,
            String email,
            String intro,
            String linkedin,
            String industry,
            String preferences,
            String topics,
            String anything) {}

    /** Mirrors the {@code Pair} interface serialized by parseCSV.ts. */
    public record PairDto(String fullNameA, String emailA, String fullNameB, String emailB) {}
}
