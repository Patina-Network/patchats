package org.patinanetwork.patchats.email;

import java.util.List;
import java.util.Optional;

/**
 * A fully-rendered email ready to send: 1–2 recipients on the To line, a plain-text subject and body, and an optional
 * Reply-To. The From address is supplied by the sender from configuration.
 */
public record OutgoingEmail(List<String> to, String subject, String body, Optional<String> replyTo) {}
