package org.patinanetwork.patchats.common.web;

import java.util.stream.Collectors;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.patinanetwork.patchats.common.web.exception.EmailNotFoundException;
import org.patinanetwork.patchats.common.web.exception.EmailNotResendableException;
import org.patinanetwork.patchats.common.web.exception.EmailTemplateNotFoundException;
import org.patinanetwork.patchats.common.web.exception.MemberDuplicateException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Maps framework exceptions to the standard {@link ApiResponder} envelope. */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponder<Void>> handleValidation(final MethodArgumentNotValidException ex) {
        final String details = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatError)
                .collect(Collectors.joining("; "));
        final String message = details.isBlank() ? "Validation failed" : details;
        return ResponseEntity.badRequest().body(ApiResponder.failure(message));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponder<Void>> handleParameterTypeMismatch(
            final MethodArgumentTypeMismatchException ex) {
        final String message = "Invalid value for query parameter '" + ex.getName() + "'";
        return ResponseEntity.badRequest().body(ApiResponder.failure(message));
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiResponder<Void>> handleParameterValidation(final HandlerMethodValidationException ex) {
        return ResponseEntity.badRequest().body(ApiResponder.failure("Invalid query parameters"));
    }

    @ExceptionHandler(MemberNotFoundException.class)
    public ResponseEntity<ApiResponder<Void>> handleMemberNotFound(final MemberNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponder.failure(ex.getMessage()));
    }

    @ExceptionHandler(MemberDuplicateException.class)
    public ResponseEntity<ApiResponder<Void>> handleMemberDuplicate(final MemberDuplicateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponder.failure(ex.getMessage()));
    }

    @ExceptionHandler(EmailTemplateNotFoundException.class)
    public ResponseEntity<ApiResponder<Void>> handleEmailTemplateNotFound(final EmailTemplateNotFoundException ex) {
        return ResponseEntity.badRequest().body(ApiResponder.failure(ex.getMessage()));
    }

    @ExceptionHandler(EmailNotFoundException.class)
    public ResponseEntity<ApiResponder<Void>> handleEmailNotFound(final EmailNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponder.failure(ex.getMessage()));
    }

    @ExceptionHandler(EmailNotResendableException.class)
    public ResponseEntity<ApiResponder<Void>> handleEmailNotResendable(final EmailNotResendableException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponder.failure(ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponder<Void>> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest().body(ApiResponder.failure(ex.getMessage()));
    }

    private String formatError(final FieldError error) {
        return error.getField() + " " + error.getDefaultMessage();
    }
}
