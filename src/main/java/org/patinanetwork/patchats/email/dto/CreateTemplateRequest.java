package org.patinanetwork.patchats.email.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request to create a new email template. All templates follow the ${} placeholder syntax. */
public record CreateTemplateRequest(
        @NotBlank(message = "Template name cannot be blank")
        @Size(max = 255, message = "Template name must be 255 characters or less")
        String name,

        @NotBlank(message = "Subject cannot be blank") String subject,

        @NotBlank(message = "Body cannot be blank") String body) {}
