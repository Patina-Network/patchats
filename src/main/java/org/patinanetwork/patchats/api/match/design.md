# Matches Spec Design

## UI Pages
- **UI /matches/{:match_id}** -> single match for both members to view
    - **GET /api/matches/{:match_id}** -> to get match info
    - **PATCH /api/admin/matches/{:match_id}** -> to modify status of the match
    - **DELETE /api/admin/matches/{:match_id}** -> to delete erroneous match
    - **PATCH /api/matches/{:match_id}** -> to modify feedback of the match

- **UI /matches** -> All matches for a member to view with optional filtering
    - **GET /api/matches?query=** 
        - by start & end time
        - by period
        - by member id
        - by status

- **UI /admin/match_cycles** -> All match cycles for an admin to view with optional filtering
    - **GET /api/match_cycles?query=**
        - by time period
        - by start & end time
    - **POST /api/admin/match_cycles** -> to create a new match cycle

- **UI /admin/match_cycles/{:match_cycle_id}** -> Detailed individual match cycle with its matches
    - **GET /api/admin/match_cycles/{:match_cycle_id}?query=**
        - by status
    - **GET /api/matches?query=** 
        - by member industry
    - **PATCH /api/admin/match_cycles/{:match_cycle_id}** -> to update a match cycle
    - **DELETE /api/admin/match_cycles/{:match_cycle_id}** -> to delete match cycle and cascade to matches
    - **POST /api/admin/matches** → to create one match for the cycle
    - **POST /api/admin/matches/bulk** -> to create many matches for the cycle
    - With link to all matches filtered to its period


## DTO 

### Cycle field semantics

- `runAt`: when the system acts for the cycle — pairs are generated and notifications are sent out.
- `period`: which month the round is *for* (e.g. "2026-07"). Label used for display/filtering; normally derived from `runAt`, but may intentionally diverge if a run slips into another month.

`MatchStatus`: PENDING | CONFIRMED | COMPLETED | CANCELLED | SKIPPED

### Admin Match Cycles

| Method | Endpoint                                    | Request                   | Response                     |
|--------|---------------------------------------------|---------------------------|------------------------------|
| POST   | `/api/admin/match_cycles`                   | `CreateMatchCycleRequest` | `MatchCycleResponse`         |
| GET    | `/api/admin/match_cycles`                   | `MatchCycleListQuery`     | `List<MatchCycleResponse>`   |
| GET    | `/api/admin/match_cycles/{:match_cycle_id}` | `MatchCycleDetailQuery`   | `MatchCycleDetailResponse`   |
| PATCH  | `/api/admin/match_cycles/{:match_cycle_id}` | `UpdateMatchCycleRequest` | `MatchCycleResponse`         |
| DELETE | `/api/admin/match_cycles/{:match_cycle_id}` | —                         | `Void`                       |


```java
// admin list view — no embedded matches
public class MatchCycleResponse {
    private Integer matchCycleId;
    private String period;  // e.g. "2026-07"
    private Instant runAt;
    private Integer totalMembers;
    private Integer totalMatched;
}

// admin detail — cycle + filtered matches
public class MatchCycleDetailResponse {
    private MatchCycleResponse cycle;
    private List<AdminMatchResponse> matches;
}

// POST /api/admin/match_cycles
public class CreateMatchCycleRequest {
    private Instant runAt;
    private String period;  // optional
    private Integer totalMembers;
    private Integer totalMatched;
}

// PATCH /api/admin/match_cycles/{id}
public class UpdateMatchCycleRequest {
    private Instant runAt;  // all optional (partial update)
    private String period;
    private Integer totalMembers;
    private Integer totalMatched;
}

// GET /api/admin/match_cycles (query params)
public class MatchCycleListQuery {
    private String period;
    private Instant startTime;
    private Instant endTime;
}

// GET /api/admin/match_cycles/{id} (filters inner matches)
public class MatchCycleDetailQuery {
    private String memberIndustry;  // either member's industry
    private String status;
}
```


### Admin Matches

| Method | Endpoint                         | Request                    | Response                 |
|--------|----------------------------------|----------------------------|--------------------------|
| POST   | `/api/admin/matches`             | `CreateMatchRequest`       | `AdminMatchResponse`     |
| POST   | `/api/admin/matches/bulk`        | `BulkCreateMatchesRequest` | `List<AdminMatchResponse>` |
| PATCH  | `/api/admin/matches/{:match_id}` | `UpdateMatchStatusRequest` | `AdminMatchResponse`     |
| DELETE | `/api/admin/matches/{:match_id}` | —                          | `Void`                   |

```java
// admin — adds matchCycleId, matchScore, createdAt
public class AdminMatchResponse {
    private String matchId;    // UUID
    private String memberAId;  // UUID
    private String memberBId;  // UUID
    private Integer matchCycleId;
    private String month;      // "YYYY-MM"
    private String status;
    private Double matchScore;  // nullable, internal
    private String feedbackA;
    private String feedbackB;
    private Instant createdAt;
}

// POST /api/admin/matches
public class CreateMatchRequest {
    private String memberAId;    // UUID
    private String memberBId;    // UUID
    private Integer matchCycleId;
    private Double matchScore;   // optional
    private String status;  // defaults to "PENDING"
}

// POST /api/admin/matches/bulk
public class BulkCreateMatchesRequest {
    private List<CreateMatchRequest> matches;
}

// PATCH /api/admin/matches/{match_id}
public class UpdateMatchStatusRequest {
    private String status;
}
```


### Member Matches

| Method | Endpoint                   | Request                      | Response                  |
|--------|----------------------------|------------------------------|---------------------------|
| GET    | `/api/matches`             | `MatchListQuery`             | `List<MatchResponse>`     |
| GET    | `/api/matches/{:match_id}` | —                            | `MatchResponse`           |
| PATCH  | `/api/matches/{:match_id}` | `UpdateMatchFeedbackRequest` | `MatchResponse`           |

```java
// public — no matchCycleId, no matchScore
public class MatchResponse {
    private String matchId;    // UUID
    private String memberAId;  // UUID
    private String memberBId;  // UUID
    private String month;      // "YYYY-MM", derived from cycle.runAt
    private String status;
    private String feedbackA;  // free-text, nullable
    private String feedbackB;  // free-text, nullable
}

// GET /api/matches (query params)
public class MatchListQuery {
    private String memberId;    // UUID
    private String period;      // "YYYY-MM"
    private Instant startTime;  // paired with endTime
    private Instant endTime;
    private String status;
}

// PATCH /api/matches/{match_id}
public class UpdateMatchFeedbackRequest {
    private String feedback;  // free-text  (which side = from auth context)
}
```


### Layering

**Controllers** (`api/match/`):
- `MatchController` (`/api/matches`)
- `MatchCycleController` (`/api/admin/match_cycles`)

**Services**: orchestrate DTO ↔ model conversion, call repos.

**Repos** (Spring JDBC, `JdbcClient`):
- `MatchRepo` — owns `matches` SQL; returns `Match` / `List<Match>`
- `MatchCycleRepo` — owns `match_cycles` SQL; returns `MatchCycle` / `List<MatchCycle>`

**Models**: `Match`, `MatchCycle` (Lombok `@Builder`).

**DTOs**: `MatchResponse`, `AdminMatchResponse`, `MatchCycleResponse`, etc.
Wrapped in `ApiResponder<T>` at the controller boundary.


