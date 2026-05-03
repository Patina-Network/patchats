package org.patinanetwork.patchats.api;

import io.micrometer.core.annotation.Timed;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.patinanetwork.patchats.utilities.ServerMetadataObject;
import org.patinanetwork.patchats.utilities.sha.CommitShaProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Basic server metadata")
@Timed(value = "controller.execution")
@EnableConfigurationProperties(CommitShaProperties.class)
public class ApiController {

    private final CommitShaProperties commitShaProperties;

    public ApiController(CommitShaProperties commitShaProperties) {
        this.commitShaProperties = commitShaProperties;
    }

    @Operation(summary = "Basic metadata about the server")
    @GetMapping
    public ResponseEntity<ApiResponder<ServerMetadataObject>> apiIndex(final HttpServletRequest request) {
        return ResponseEntity.ok()
                .body(ApiResponder.success(
                        "Hello from Patchats!", new ServerMetadataObject(commitShaProperties.getSha())));
        }
}
