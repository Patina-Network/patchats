package org.patinanetwork.patchats.api.match;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.api.match.db.models.Match.MatchStatus;
import org.patinanetwork.patchats.api.match.db.repos.MatchFilterCriteria;
import org.patinanetwork.patchats.api.match.dto.CreateMatchRequest;
import org.patinanetwork.patchats.api.match.dto.MatchListItemResponse;
import org.patinanetwork.patchats.api.match.dto.MatchResponse;
import org.patinanetwork.patchats.api.match.dto.UpdateMatchRequest;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.patinanetwork.patchats.common.web.exception.MatchCycleNotFoundException;
import org.patinanetwork.patchats.common.web.exception.MatchNotFoundException;
import org.patinanetwork.patchats.common.web.exception.MemberNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MatchController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class MatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MatchService matchService;

    private static final UUID MEMBER_A_ID = UUID.randomUUID();
    private static final UUID MEMBER_B_ID = UUID.randomUUID();
    private static final Integer CYCLE_ID = 1;

    private static String createBody(final UUID memberAId, final UUID memberBId, final Integer cycleId) {
        return "{" + jsonField("memberAId", memberAId) + "," + jsonField("memberBId", memberBId) + ","
                + jsonField("matchCycleId", cycleId) + "}";
    }

    private static String jsonField(final String name, final Object value) {
        if (value == null) {
            return "\"" + name + "\":null";
        }
        return value instanceof Number ? "\"" + name + "\":" + value : "\"" + name + "\":\"" + value + "\"";
    }

    private static MatchResponse matchResponse(final UUID id) {
        return MatchResponse.builder()
                .id(id)
                .memberAId(MEMBER_A_ID)
                .memberBId(MEMBER_B_ID)
                .matchCycleId(CYCLE_ID)
                .matchScore(0.0)
                .status(MatchStatus.PENDING)
                .build();
    }

    // ---------- createMatch ----------

    @Test
    void createMatch_returnsOkAndCreatedMatch() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.createMatch(any(CreateMatchRequest.class))).thenReturn(matchResponse(id));

        mockMvc.perform(post("/api/match")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Match created successfully"))
                .andExpect(jsonPath("$.payload.id").value(id.toString()))
                .andExpect(jsonPath("$.payload.status").value("PENDING"));

        final ArgumentCaptor<CreateMatchRequest> captor = ArgumentCaptor.forClass(CreateMatchRequest.class);
        verify(matchService).createMatch(captor.capture());
        assertEquals(MEMBER_A_ID, captor.getValue().memberAId());
        assertEquals(MEMBER_B_ID, captor.getValue().memberBId());
        assertEquals(CYCLE_ID, captor.getValue().matchCycleId());
    }

    @Test
    void createMatch_badRequestWhenRequiredFieldMissing() throws Exception {
        mockMvc.perform(post("/api/match")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(null, MEMBER_B_ID, CYCLE_ID)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(matchService, never()).createMatch(any());
    }

    @Test
    void createMatch_badRequestWhenServiceRejectsMatch() throws Exception {
        when(matchService.createMatch(any(CreateMatchRequest.class)))
                .thenThrow(new ValidationException("Member A and Member B cannot be the same."));

        mockMvc.perform(post("/api/match")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(MEMBER_A_ID, MEMBER_A_ID, CYCLE_ID)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Member A and Member B cannot be the same."));
    }

    @Test
    void createMatch_notFoundWhenMemberDoesNotExist() throws Exception {
        when(matchService.createMatch(any(CreateMatchRequest.class)))
                .thenThrow(new MemberNotFoundException(MEMBER_A_ID));

        mockMvc.perform(post("/api/match")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void createMatch_notFoundWhenMatchCycleDoesNotExist() throws Exception {
        when(matchService.createMatch(any(CreateMatchRequest.class)))
                .thenThrow(new MatchCycleNotFoundException(CYCLE_ID));

        mockMvc.perform(post("/api/match")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ---------- updateMatch ----------

    @Test
    void updateMatch_returnsOkAndUpdatedMatch() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.updateMatch(any(UpdateMatchRequest.class), eq(id))).thenReturn(matchResponse(id));

        mockMvc.perform(patch("/api/match/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(MEMBER_A_ID, MEMBER_B_ID, CYCLE_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Match updated successfully"))
                .andExpect(jsonPath("$.payload.id").value(id.toString()));
    }

    @Test
    void updateMatch_allowsPartialBody() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.updateMatch(any(UpdateMatchRequest.class), eq(id))).thenReturn(matchResponse(id));

        mockMvc.perform(patch("/api/match/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"matchCycleId\":2}"))
                .andExpect(status().isOk());

        final ArgumentCaptor<UpdateMatchRequest> captor = ArgumentCaptor.forClass(UpdateMatchRequest.class);
        verify(matchService).updateMatch(captor.capture(), eq(id));
        assertEquals(null, captor.getValue().memberAId());
        assertEquals(null, captor.getValue().memberBId());
        assertEquals(2, captor.getValue().matchCycleId());
    }

    @Test
    void updateMatch_notFoundWhenMatchDoesNotExist() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.updateMatch(any(UpdateMatchRequest.class), eq(id))).thenThrow(new MatchNotFoundException(id));

        mockMvc.perform(patch("/api/match/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"matchCycleId\":2}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void updateMatch_badRequestWhenServiceRejectsUpdate() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.updateMatch(any(UpdateMatchRequest.class), eq(id)))
                .thenThrow(new ValidationException("Member A and Member B cannot be the same."));

        mockMvc.perform(patch("/api/match/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(MEMBER_A_ID, MEMBER_A_ID, null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ---------- getMatchById ----------

    @Test
    void getMatchById_returnsOkAndMatch() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.getMatchById(id)).thenReturn(matchResponse(id));

        mockMvc.perform(get("/api/match/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Match retrieved successfully"))
                .andExpect(jsonPath("$.payload.id").value(id.toString()))
                .andExpect(jsonPath("$.payload.memberAId").value(MEMBER_A_ID.toString()));
    }

    @Test
    void getMatchById_notFoundWhenMatchDoesNotExist() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.getMatchById(id)).thenThrow(new MatchNotFoundException(id));

        mockMvc.perform(get("/api/match/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void getMatchById_badRequestWhenIdIsNotUuid() throws Exception {
        mockMvc.perform(get("/api/match/{id}", "not-a-uuid")).andExpect(status().isBadRequest());

        verify(matchService, never()).getMatchById(any());
    }

    // ---------- deleteMatch ----------

    @Test
    void deleteMatch_returnsOkAndDeletedMatch() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.deleteMatchById(id)).thenReturn(matchResponse(id));

        mockMvc.perform(delete("/api/match/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Match deleted successfully"))
                .andExpect(jsonPath("$.payload.id").value(id.toString()));
    }

    @Test
    void deleteMatch_notFoundWhenMatchDoesNotExist() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.deleteMatchById(id)).thenThrow(new MatchNotFoundException(id));

        mockMvc.perform(delete("/api/match/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ---------- filterMatches ----------

    @Test
    void filterMatches_returnsOkAndMatches() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.filterMatches(any(MatchFilterCriteria.class)))
                .thenReturn(List.of(MatchListItemResponse.builder()
                        .id(id)
                        .memberAName("Alice Test")
                        .memberBName("Bob Test")
                        .period("October 2026")
                        .status(MatchStatus.PENDING)
                        .build()));

        mockMvc.perform(get("/api/match"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Matches retrieved successfully"))
                .andExpect(jsonPath("$.payload.length()").value(1))
                .andExpect(jsonPath("$.payload[0].id").value(id.toString()))
                .andExpect(jsonPath("$.payload[0].memberAName").value("Alice Test"))
                .andExpect(jsonPath("$.payload[0].period").value("October 2026"));
    }

    @Test
    void filterMatches_withNoParamsPassesEmptyCriteria() throws Exception {
        when(matchService.filterMatches(any(MatchFilterCriteria.class))).thenReturn(List.of());

        mockMvc.perform(get("/api/match")).andExpect(status().isOk());

        final ArgumentCaptor<MatchFilterCriteria> captor = ArgumentCaptor.forClass(MatchFilterCriteria.class);
        verify(matchService).filterMatches(captor.capture());
        final MatchFilterCriteria criteria = captor.getValue();
        assertTrue(criteria.startTime().isEmpty());
        assertTrue(criteria.endTime().isEmpty());
        assertTrue(criteria.period().isEmpty());
        assertTrue(criteria.memberId().isEmpty());
        assertTrue(criteria.matchCycleId().isEmpty());
        assertTrue(criteria.memberIndustry().isEmpty());
        assertTrue(criteria.status().isEmpty());
    }

    @Test
    void filterMatches_passesEveryQueryParamToCriteria() throws Exception {
        final UUID memberId = UUID.randomUUID();
        when(matchService.filterMatches(any(MatchFilterCriteria.class))).thenReturn(List.of());

        mockMvc.perform(get("/api/match")
                        .param("startTime", "2026-10-01T00:00:00Z")
                        .param("endTime", "2026-10-31T23:59:59Z")
                        .param("period", "October 2026")
                        .param("memberId", memberId.toString())
                        .param("matchCycleId", "3")
                        .param("memberIndustry", "Finance")
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk());

        final ArgumentCaptor<MatchFilterCriteria> captor = ArgumentCaptor.forClass(MatchFilterCriteria.class);
        verify(matchService).filterMatches(captor.capture());
        final MatchFilterCriteria criteria = captor.getValue();
        assertEquals(Optional.of(Instant.parse("2026-10-01T00:00:00Z")), criteria.startTime());
        assertEquals(Optional.of(Instant.parse("2026-10-31T23:59:59Z")), criteria.endTime());
        assertEquals(Optional.of("October 2026"), criteria.period());
        assertEquals(Optional.of(memberId), criteria.memberId());
        assertEquals(Optional.of(3), criteria.matchCycleId());
        assertEquals(Optional.of("Finance"), criteria.memberIndustry());
        assertEquals(Optional.of(MatchStatus.COMPLETED), criteria.status());
    }

    @Test
    void filterMatches_badRequestWhenStatusUnknown() throws Exception {
        mockMvc.perform(get("/api/match").param("status", "BANANA"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(matchService, never()).filterMatches(any());
    }

    @Test
    void filterMatches_badRequestWhenMemberIdIsNotUuid() throws Exception {
        mockMvc.perform(get("/api/match").param("memberId", "not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(matchService, never()).filterMatches(any());
    }

    @Test
    void setMatchStatus_returnsOkAndUpdatedMatch() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.setMatchStatus(id, MatchStatus.COMPLETED))
                .thenReturn(MatchResponse.builder()
                        .id(id)
                        .status(MatchStatus.COMPLETED)
                        .build());

        mockMvc.perform(patch("/api/match/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Match status updated successfully"))
                .andExpect(jsonPath("$.payload.status").value("COMPLETED"));
    }

    @Test
    void setMatchStatus_notFoundWhenMatchDoesNotExist() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.setMatchStatus(id, MatchStatus.COMPLETED)).thenThrow(new MatchNotFoundException(id));

        mockMvc.perform(patch("/api/match/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void setMatchStatus_badRequestWhenStatusMissing() throws Exception {
        mockMvc.perform(patch("/api/match/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(matchService, never()).setMatchStatus(any(), any());
    }

    @Test
    void setMatchStatus_badRequestWhenStatusUnknown() throws Exception {
        mockMvc.perform(patch("/api/match/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"BANANA\"}"))
                .andExpect(status().isBadRequest());

        verify(matchService, never()).setMatchStatus(any(), any());
    }

    @Test
    void setMatchScore_returnsOkAndUpdatedMatch() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.setMatchScore(id, 0.85))
                .thenReturn(MatchResponse.builder().id(id).matchScore(0.85).build());

        mockMvc.perform(patch("/api/match/{id}/score", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"score\":0.85}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Match score updated successfully"))
                .andExpect(jsonPath("$.payload.matchScore").value(0.85));
    }

    @Test
    void setMatchScore_notFoundWhenMatchDoesNotExist() throws Exception {
        final UUID id = UUID.randomUUID();
        when(matchService.setMatchScore(eq(id), any())).thenThrow(new MatchNotFoundException(id));

        mockMvc.perform(patch("/api/match/{id}/score", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"score\":0.85}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void setMatchScore_badRequestWhenScoreMissing() throws Exception {
        mockMvc.perform(patch("/api/match/{id}/score", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(matchService, never()).setMatchScore(any(), any());
    }
}
