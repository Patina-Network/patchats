package org.patinanetwork.patchats.api.match;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.patinanetwork.patchats.api.match.dto.match.AdminMatchResponse;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.patinanetwork.patchats.common.web.exception.MatchCycleNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminMatchController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class AdminMatchControllerTest {

    private static final String MEMBER_A_ID = "11111111-1111-1111-1111-111111111111";
    private static final String MEMBER_B_ID = "22222222-2222-2222-2222-222222222222";
    private static final String REQUEST_BODY =
            "{\"memberAId\":\"%s\",\"memberBId\":\"%s\",\"matchCycleId\":1,\"matchScore\":0.85,\"status\":\"CONFIRMED\"}"
                    .formatted(MEMBER_A_ID, MEMBER_B_ID);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MatchService matchService;

    @Test
    void createMatch_ReturnsOkAndAdminMatchResponse() throws Exception {
        when(matchService.createMatch(any()))
                .thenReturn(AdminMatchResponse.builder()
                        .matchId(UUID.fromString("33333333-3333-3333-3333-333333333333"))
                        .memberAId(UUID.fromString(MEMBER_A_ID))
                        .memberBId(UUID.fromString(MEMBER_B_ID))
                        .matchCycleId(1)
                        .month("2026-07")
                        .status("CONFIRMED")
                        .matchScore(0.85)
                        .createdAt(Instant.parse("2026-07-15T10:00:00Z"))
                        .build());

        mockMvc.perform(post("/api/admin/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.payload.matchId").value("33333333-3333-3333-3333-333333333333"))
                .andExpect(jsonPath("$.payload.memberAId").value(MEMBER_A_ID))
                .andExpect(jsonPath("$.payload.memberBId").value(MEMBER_B_ID))
                .andExpect(jsonPath("$.payload.matchCycleId").value(1))
                .andExpect(jsonPath("$.payload.month").value("2026-07"))
                .andExpect(jsonPath("$.payload.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.payload.matchScore").value(0.85))
                .andExpect(jsonPath("$.payload.createdAt").isNotEmpty());
    }

    @Test
    void createMatch_ReturnsBadRequestWhenMemberAIdMissing() throws Exception {
        mockMvc.perform(post("/api/admin/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"memberBId\":\"%s\",\"matchCycleId\":1}".formatted(MEMBER_B_ID)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void createMatch_ReturnsNotFoundWhenCycleMissing() throws Exception {
        when(matchService.createMatch(any())).thenThrow(new MatchCycleNotFoundException(1));

        mockMvc.perform(post("/api/admin/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
