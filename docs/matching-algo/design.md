# Matching Algorithm — Design

How the monthly pairing algorithm turns a list of members into coffee chat pairs. This covers the rule-based layers
(random, history, match preference, industry); the LLM / profile-similarity layer is documented separately.

Source: `src/main/java/org/patinanetwork/patchats/matchingalgo/`

---

## Files

| File                          | Role                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `MatchingLayer.java`          | Enum of layers in priority order. Selecting a layer turns on it and every layer before it. |
| `scoring/PairScorer.java`     | Interface: `score(memberA, memberB) → int`. Each layer contributes one scorer.        |
| `scoring/HistoryScorer.java`  | Penalizes pairs who have been matched before.                                         |
| `scoring/MatchPrefScorer.java`| Rewards compatible match preferences, penalizes conflicting ones.                     |
| `scoring/IndustryScorer.java` | Rewards pairs in the same specific industry.                                          |
| `model/MatchPreference.java`  | Parses `Member.matchPref` (Mentor / Mentee / Peer / No Preference).                   |
| `model/Industry.java`         | Parses `Member.industryPref` (Technology / Finance / Business / Design / Other / No Preference). |
| `model/MemberPair.java`       | Record: two members + the pair's total score.                                         |
| `model/PairingResult.java`    | Record: the list of pairs + the unmatched member, if the count was odd.               |
| `pairing/GreedyPairer.java`   | The algorithm: scores every pair, takes the best ones first.                          |
| `pairing/RandomPairer.java`   | Baseline: shuffle and pair in order, every score is 0.                                |

---

## Flow

```
                    ┌──────────────────────────────┐
                    │  Input: List<Member>         │
                    │  + chosen MatchingLayer      │
                    │    (e.g. "industry")         │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
        ┌────────────────────────────────────────────────────┐
        │ MatchingLayer.upToAndIncluding()                   │
        │ enum order = priority:                             │
        │   RANDOM → HISTORY → MATCH_PREF → INDUSTRY         │
        │ picking INDUSTRY turns on all 4                    │
        └──────────────┬─────────────────────────────────────┘
                       │  each layer → 0 or 1 scorer
                       ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │ List<PairScorer>                                                 │
   │                                                                  │
   │  RANDOM      → No scorer: randomness comes from the shuffle.     │
   │  HISTORY     → HistoryScorer      met before?      -100          │
   │  MATCH_PREF  → MatchPrefScorer    uses MatchPreference enum      │
   │                   Mentor↔Mentee / Peer↔Peer        +20           │
   │                   either "No Preference"           +0            │
   │                   conflict (e.g. Mentor↔Mentor)    -20           │
   │  INDUSTRY    → IndustryScorer     uses Industry enum             │
   │                   same *specific* industry         +10           │
   │                   (Other / No Pref never count)                  │
   └──────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │ GreedyPairer.pair(members)                                       │
   │  1. shuffle members with a seeded Random (breaks ties)           │
   │  2. build EVERY possible pair (n·(n-1)/2 of them)                │
   │       score = sum of all scorers → new MemberPair(A, B, score)   │
   │  3. sort pairs from highest to lowest score (stable sort keeps   │
   │     the shuffled order for ties)                                 │
   │  4. walk the list top-down: take a pair only if neither          │
   │     member is already taken                                      │
   │  5. anyone left over (odd count) → unmatched                     │
   └──────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
        ┌────────────────────────────────────────────┐
        │ PairingResult                              │
        │   pairs:     List<MemberPair>              │
        │   unmatched: Optional<Member>  → placed    │
        │                                  manually  │
        │                                  by admin  │
        └────────────────────────────────────────────┘
```

`RandomPairer` is a simpler standalone version: shuffle, pair members 0+1, 2+3, …, with every score 0. `GreedyPairer`
with no scorers gives the same result for the same seed, so `RandomPairer` serves as a baseline.

---

## Design Notes

### Layer priority comes from score magnitude

Scores from each layer add together, so the size of each number decides what wins:

| Layer      | Range       | Effect                                                         |
| ---------- | ----------- | -------------------------------------------------------------- |
| History    | -100 or 0   | Much larger than anything else, so repeats are a last resort.  |
| Match pref | -20 to +20  | Main signal for who should meet whom.                          |
| Industry   | 0 or +10    | Mostly breaks ties between pairs the earlier layers score equally. |

One exception: "No Preference" on match pref scores +10, so a no-preference pair in the same industry (+20) ties with a
Mentor↔Mentee pair in different industries.

### Greedy, not optimal

`GreedyPairer` always takes the best pair it can see right now and does not look ahead, so the total score is not
guaranteed to be the best possible. For example, taking a +30 pair early could force two other members into a -100
repeat later. This trade-off is acceptable at the current member count.

### Bad data scores as neutral

`Industry.fromIndustryPref` and `MatchPreference.fromMatchPref` map missing or unrecognized values to `NO_PREFERENCE`,
so bad profile data does not crash a run.

### Adding a layer

1. Implement `PairScorer`.
2. Append a constant to `MatchingLayer` in priority order (declaration order is run order).
3. Map the new layer to its scorer where scorers are built (currently `MatchingCli.scorerFor`).
4. Choose a score range that fits the priority table above.
