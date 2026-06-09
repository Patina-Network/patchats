package org.patinanetwork.patchats.common.web;

import java.util.stream.Collectors;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

    private String formatError(final FieldError error) {
        return error.getField() + " " + error.getDefaultMessage();
    }
}
