package org.patinanetwork.patchats.auth;

import io.micrometer.core.annotation.Timed;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.auth.dto.AddAdminRequest;
import org.patinanetwork.patchats.auth.dto.AdminDto;
import org.patinanetwork.patchats.auth.repo.AdminRepo;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST endpoints for managing the admin allowlist. */
@RestController
@RequestMapping("/api/admin/admins")
@Tag(name = "Admin")
@Timed(value = "controller.execution")
@RequiredArgsConstructor
public class AdminController {

    private final AdminRepo adminRepo;

    @Operation(summary = "List all admins on the allowlist")
    @GetMapping
    public ResponseEntity<ApiResponder<List<AdminDto>>> listAdmins() {
        final List<AdminDto> admins = adminRepo.listAdmins();
        return ResponseEntity.ok(ApiResponder.success("Found %d admins".formatted(admins.size()), admins));
    }

    @Operation(summary = "Add an email to the admin allowlist")
    @PostMapping
    public ResponseEntity<ApiResponder<AdminDto>> addAdmin(@Valid @RequestBody final AddAdminRequest request) {
        final AdminDto admin = adminRepo.addAdmin(request.email(), request.note());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponder.success("Admin added: %s".formatted(admin.email()), admin));
    }

    @Operation(summary = "Remove an email from the admin allowlist")
    @DeleteMapping("/{email:.+}")
    public ResponseEntity<ApiResponder<Void>> removeAdmin(@PathVariable final String email) {
        adminRepo.removeAdmin(email);
        return ResponseEntity.ok(ApiResponder.success("Admin removed: %s".formatted(email), null));
    }
}
