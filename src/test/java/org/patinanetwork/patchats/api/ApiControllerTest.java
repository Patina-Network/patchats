package org.patinanetwork.patchats.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.common.dto.ApiResponder;
import org.patinanetwork.patchats.utilities.ServerMetadataObject;
import org.patinanetwork.patchats.utilities.sha.CommitShaProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import jakarta.servlet.http.HttpServletRequest;

public class ApiControllerTest {
    private final CommitShaProperties commitShaProperties = mock(CommitShaProperties.class);

    private ApiController apiController;

    public ApiControllerTest() {
        this.apiController = new ApiController(commitShaProperties);
    }

    @Test
    void testApiIndex() {
        when(commitShaProperties.getSha()).thenReturn("2fd4e1c");
        HttpServletRequest request = mock(HttpServletRequest.class);

        ResponseEntity<ApiResponder<ServerMetadataObject>> response = apiController.apiIndex(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());

        ApiResponder<ServerMetadataObject> body = response.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals("Hello from Patchats!", body.getMessage());

        ServerMetadataObject data = body.getPayload();
        assertNotNull(data);
        assertEquals("2fd4e1c", data.getVersion());
    }
}
