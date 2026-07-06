package org.patinanetwork.patchats.auth;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.email.EmailSender;
import org.patinanetwork.patchats.email.OutgoingEmail;
import org.patinanetwork.patchats.email.TemplateRenderer;
import org.springframework.stereotype.Component;

/**
 * Builds and delivers the sign-in email. Goes through the {@link EmailSender} port directly (not {@code EmailService},
 * whose batch request/response shape is for admin-triggered sends), so the dev profile's logging sender prints the full
 * body — including the link — to the backend console.
 */
@Component
@RequiredArgsConstructor
public class MagicLinkEmailComposer {

    private static final String SUBJECT = "Your PatChats sign-in link";
    private static final String BODY_TEMPLATE = """
            Hi,

            Click this link to sign in to PatChats:

            ${link}

            The link expires in ${ttlMinutes} minutes and can only be used once.

            If you didn't request this, you can safely ignore this email.""";

    private final TemplateRenderer renderer;
    private final EmailSender sender;
    private final AuthProperties properties;

    public void send(final String email, final String rawToken) {
        final String baseUrl = trimTrailingSlash(properties.getBaseUrl());
        final String link = "%s/auth/verify?token=%s".formatted(baseUrl, rawToken);
        final String body = renderer.render(
                BODY_TEMPLATE,
                Map.of(
                        "link",
                        link,
                        "ttlMinutes",
                        String.valueOf(properties.getMagicLinkTtl().toMinutes())));
        sender.send(new OutgoingEmail(List.of(email), SUBJECT, body, Optional.empty()));
    }

    private static String trimTrailingSlash(final String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
