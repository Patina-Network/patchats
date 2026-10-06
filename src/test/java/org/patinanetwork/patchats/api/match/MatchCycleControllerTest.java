package org.patinanetwork.patchats.api.match;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.patinanetwork.patchats.api.match.db.repos.MatchCycleFilterCriteria;
import org.patinanetwork.patchats.api.match.dto.MatchCycleResponse;
import org.patinanetwork.patchats.common.web.ApiExceptionHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MatchCycleController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class MatchCycleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MatchCycleService matchCycleService;

    // ---------- filterMatchCycles ----------

    @Test
    void filterMatchCycles_returnsOkAndMatchCycles() throws Exception {
        when(matchCycleService.filterMatchCycles(any(MatchCycleFilterCriteria.class)))
                .thenReturn(List.of(
                        MatchCycleResponse.builder()
                                .id(3)
                                .period("October 2026")
                                .runAt(Instant.parse("2026-10-01T14:00:00Z"))
                                .isDraft(false)
                                .build(),
                        MatchCycleResponse.builder()
                                .id(2)
                                .period("September 2026")
                                .runAt(Instant.parse("2026-09-01T14:00:00Z"))
                                .isDraft(false)
                                .build()));

        mockMvc.perform(get("/api/admin/match_cycles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Match Cycles retrieved successfully"))
                .andExpect(jsonPath("$.payload.length()").value(2))
                .andExpect(jsonPath("$.payload[0].id").value(3))
                .andExpect(jsonPath("$.payload[0].period").value("October 2026"))
                .andExpect(jsonPath("$.payload[1].id").value(2));
    }

    @Test
    void filterMatchCycles_withNoParamsPassesEmptyCriteria() throws Exception {
        when(matchCycleService.filterMatchCycles(any(MatchCycleFilterCriteria.class)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/admin/match_cycles")).andExpect(status().isOk());

        final ArgumentCaptor<MatchCycleFilterCriteria> captor = ArgumentCaptor.forClass(MatchCycleFilterCriteria.class);
        verify(matchCycleService).filterMatchCycles(captor.capture());
        final MatchCycleFilterCriteria criteria = captor.getValue();
        assertTrue(criteria.period().isEmpty());
        assertTrue(criteria.startTime().isEmpty());
        assertTrue(criteria.endTime().isEmpty());
        assertTrue(criteria.isDraft().isEmpty());
    }

    @Test
    void filterMatchCycles_passesEveryQueryParamToCriteria() throws Exception {
        when(matchCycleService.filterMatchCycles(any(MatchCycleFilterCriteria.class)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/admin/match_cycles")
                        .param("period", "October 2026")
                        .param("startTime", "2026-10-01T00:00:00Z")
                        .param("endTime", "2026-10-31T23:59:59Z")
                        .param("isDraft", "true"))
                .andExpect(status().isOk());

        final ArgumentCaptor<MatchCycleFilterCriteria> captor = ArgumentCaptor.forClass(MatchCycleFilterCriteria.class);
        verify(matchCycleService).filterMatchCycles(captor.capture());
        final MatchCycleFilterCriteria criteria = captor.getValue();
        assertEquals(Optional.of("October 2026"), criteria.period());
        assertEquals(Optional.of(Instant.parse("2026-10-01T00:00:00Z")), criteria.startTime());
        assertEquals(Optional.of(Instant.parse("2026-10-31T23:59:59Z")), criteria.endTime());
        assertEquals(Optional.of(true), criteria.isDraft());
    }

    @Test
    void filterMatchCycles_badRequestWhenStartTimeIsNotInstant() throws Exception {
        mockMvc.perform(get("/api/admin/match_cycles").param("startTime", "yesterday"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(matchCycleService, never()).filterMatchCycles(any());
    }
}
