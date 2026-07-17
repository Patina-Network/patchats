### Overview

 - This API lists matches from database

### Endpoints

| Method | Path | Description | 
|--------|------|-------------|
| GET | /api/matches/{year} | List pairings by year |
| GET | /api/matches/{year}/{month} | List pairings by month |
| GET | /api/matches/member/{id} | List pairings by member id |

/api/matches/list?query
- The /year/month is too hardcoded 
    * Start time and end time
    * period 
    * match cycles should be int
    * search params instead of url 

  Response: `ApiResponder<Match[]>`
  ```typescript
  interface Match {
      match_id: string     // UUID
      member_a_id: string  // UUID
      member_b_id: string  // UUID
      month: string        // YYYY-MM, from match_cycles.run_at
      status: string
  }
  ```
* Figured a flat list is more flexible for rendering instead of grouping by month server side

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
- owns the SQL above; returns `List<Match>`

DTO: `Match` (interface Match)
- `ApiResponder<List<Match>>`


