# Matches Spec Design

## UI Pages
- **UI /matches/{:match_id}** -> single match for both members to view
    - **PATCH /api/admin/matches/{:match_id}** -> to modify status of the match
    - **DELETE /api/admin/matches/{:match_id}** -> to delete erroneous match
    - **PATCH /api/matches/{:match_id}** -> to modify feedback of the match
    - **GET /api/matches/{:match_id}** -> to get match info

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
    private Integer cycleId;
    private String period;  // e.g. "2026-07"
    private Instant runAt;
    private Integer totalMembers;
    private Integer totalMatched;
    private List<String> unmatchedIds;  // UUIDs
}

// admin detail — cycle + filtered matches
public class MatchCycleDetailResponse {
    private MatchCycleResponse cycle;
    private List<AdminMatchResponse> matches;
}

// POST /api/admin/match_cycles
public class CreateMatchCycleRequest {
    private Instant runAt;
    private String period;  // optiona:l
    private Integer totalMembers;
    private Integer totalMatched;
    private List<String> unmatchedIds;
}

// PATCH /api/admin/match_cycles/{id}
public class UpdateMatchCycleRequest {
    private Instant runAt;  // all optional (partial update)
    private String period;
    private Integer totalMembers;
    private Integer totalMatched;
    private List<String> unmatchedIds;
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
    private MatchStatus status;
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
// admin — adds cycleId, matchScore, createdAt
public class AdminMatchResponse {
    private String matchId;    // UUID
    private String memberAId;  // UUID
    private String memberBId;  // UUID
    private String cycleId;    // UUID
    private String month;      // "YYYY-MM"
    private MatchStatus status;
    private Double matchScore;  // nullable, internal
    private Integer feedbackA;
    private Integer feedbackB;
    private Instant createdAt;
}

// POST /api/admin/matches
public class CreateMatchRequest {
    private String memberAId;    // UUID
    private String memberBId;    // UUID
    private String cycleId;      // UUID
    private Double matchScore;   // optional
    private MatchStatus status;  // defaults to PENDING
}

// POST /api/admin/matches/bulk
public class BulkCreateMatchesRequest {
    private List<CreateMatchRequest> matches;
}

// PATCH /api/admin/matches/{match_id}
public class UpdateMatchStatusRequest {
    private MatchStatus status;
}
```


### Member Matches

| Method | Endpoint                   | Request                      | Response                  |
|--------|----------------------------|------------------------------|---------------------------|
| GET    | `/api/matches`             | `MatchListQuery`             | `List<MatchResponse>`     |
| GET    | `/api/matches/{:match_id}` | —                            | `MatchResponse`           |
| PATCH  | `/api/matches/{:match_id}` | `UpdateMatchFeedbackRequest` | `MatchResponse`           |

```java
// public — no cycle_id, no match_score
public class MatchResponse {
    private String matchId;    // UUID
    private String memberAId;  // UUID
    private String memberBId;  // UUID
    private String month;      // "YYYY-MM", derived from cycle.runAt
    private MatchStatus status;
    private Integer feedbackA;  // 1-5, nullable
    private Integer feedbackB;  // 1-5, nullable
}

// GET /api/matches (query params)
public class MatchListQuery {
    private String memberId;    // UUID
    private String period;      // "YYYY-MM"
    private Instant startTime;  // paired with endTime
    private Instant endTime;
    private MatchStatus status;
}

// PATCH /api/matches/{match_id}
public class UpdateMatchFeedbackRequest {
    private Integer feedback;  // 1-5  (which side = from auth context)
}
```

## /api/matches/{year}
* Join on match_cycles, filtered by run_at within year
```sql
   SELECT m.id, m.member_a_id, m.member_b_id, m.status,
          to_char(c.run_at, 'YYYY-MM') AS month
   FROM matches m
   JOIN match_cycles c ON m.cycle_id = c.id
   WHERE c.run_at >= TIMESTAMPTZ '2026-01-01'
     AND c.run_at <  TIMESTAMPTZ '2027-01-01';
 ```
 
## /api/matches/{year}/{month}
* Join on match_cycles, filtered by run_at within month
```sql
   SELECT m.id, m.member_a_id, m.member_b_id, m.status,
          to_char(c.run_at, 'YYYY-MM') AS month
   FROM matches m
   JOIN match_cycles c ON m.cycle_id = c.id
   WHERE c.run_at >= TIMESTAMPTZ '2026-01-01'
     AND c.run_at <  TIMESTAMPTZ '2026-02-01';
```

## /api/matches/member/{id}
* Filter matches by member id
```sql
   SELECT m.id, m.member_a_id, m.member_b_id, m.status,
          to_char(c.run_at, 'YYYY-MM') AS month
   FROM matches m
   JOIN match_cycles c ON m.cycle_id = c.id
   WHERE m.member_a_id = :id
     OR  m.member_b_id = :id
```

### Layering

Controller: 
- `MatchController` (`/api/matches`)
    * `listByYear(year)`
    * `listByMonth(year, month)`
    * `listByMember(id)`

Repository: `MatchRepository` (Spring JDBC, `NamedParameterJdbcTemplate`)
- owns the SQL above; returns `List<MatchResponse>`

DTO: `MatchResponse` (interface Match)
- `ApiResponder<List<MatchResponse>>`


