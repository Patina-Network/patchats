import { http, HttpResponse } from "msw";

// Alex Morgan and Jordan Lee share ids with members.mock.ts.
const members = {
  alex: { id: "50ecf8a0-6345-40f8-b59f-438c3f338b82", name: "Alex Morgan" },
  chris: { id: "749ebbad-910e-4095-9225-1dfd811fe58c", name: "Chris Nguyen" },
  diego: { id: "193137ca-dfce-4b77-a9c2-85e93604f745", name: "Diego Alvarez" },
  hana: { id: "ec76a992-59d0-4c65-8558-4696c9e7498b", name: "Hana Sato" },
  jordan: { id: "db827ce4-5ed1-4649-98ca-3e5fb538d22e", name: "Jordan Lee" },
  maya: { id: "3fb22c81-5817-457e-95ef-4c635f313e05", name: "Maya Patel" },
  noah: { id: "1876cd2d-67c1-456e-8109-d6c9b480f304", name: "Noah Brooks" },
  priya: { id: "4cfa984e-f9d0-411c-8cc5-281f996db483", name: "Priya Shah" },
  sam: { id: "7cdaf540-fd33-4c4d-9383-cb64bb8d1c73", name: "Sam Rivera" },
  taylor: { id: "c961930a-f3b4-440c-b180-edcff50ed6f6", name: "Taylor Kim" },
};

type MockMember = (typeof members)[keyof typeof members];
type MockMatchStatus =
  | "CANCELLED"
  | "COMPLETED"
  | "CONFIRMED"
  | "PENDING"
  | "SKIPPED";

const august = {
  id: 1,
  isDraft: false,
  period: "August 2026",
  runAt: "2026-08-01T14:00:00Z",
};
const september = {
  id: 2,
  isDraft: false,
  period: "September 2026",
  runAt: "2026-09-01T14:00:00Z",
};
const october = {
  id: 3,
  isDraft: false,
  period: "October 2026",
  runAt: "2026-10-01T14:00:00Z",
};

export const matchCyclesFixture = [august, september, october];

type MatchRow = {
  a: MockMember;
  b: MockMember;
  cycle: typeof august;
  id: string;
  score: number;
  status: MockMatchStatus;
};

/** Shapes a row like MatchListItemResponse from GET /api/match. */
const toListItem = ({ a, b, cycle, id, score, status }: MatchRow) => ({
  createdAt: cycle.runAt,
  id,
  matchCycleId: cycle.id,
  matchScore: score,
  memberAId: a.id,
  memberAName: a.name,
  memberBId: b.id,
  memberBName: b.name,
  period: cycle.period,
  status,
});

const { alex, chris, diego, hana, jordan, maya, noah, priya, sam, taylor } =
  members;

// 5 matches per cycle; each member appears once per cycle.
// prettier-ignore
const rows: MatchRow[] = [
  // August 2026: finished cycle
  { a: alex, b: priya, cycle: august, id: "06997822-d183-488a-a911-b6407d766c74", score: 0.92, status: "COMPLETED" },
  { a: jordan, b: sam, cycle: august, id: "e3131e55-8b82-45f9-897e-b27f46398ee1", score: 0.81, status: "COMPLETED" },
  { a: taylor, b: chris, cycle: august, id: "e1686414-0a68-489e-bf04-c61e969e1f90", score: 0.67, status: "CANCELLED" },
  { a: maya, b: diego, cycle: august, id: "0260151c-4d83-44bb-9ee2-7ea063d54f07", score: 0.88, status: "COMPLETED" },
  { a: hana, b: noah, cycle: august, id: "b7ee8d34-122f-4c36-95f1-9ff2df25d3ac", score: 0.74, status: "SKIPPED" },
  // September 2026: finished cycle
  { a: alex, b: sam, cycle: september, id: "939f6dda-1857-4df8-a8e2-90c731845007", score: 0.85, status: "COMPLETED" },
  { a: jordan, b: taylor, cycle: september, id: "1f8093bd-e859-41b6-aa75-6339d8f6b530", score: 0.7, status: "SKIPPED" },
  { a: priya, b: maya, cycle: september, id: "8869c263-7385-48c1-b597-d019d1999a90", score: 0.9, status: "COMPLETED" },
  { a: chris, b: hana, cycle: september, id: "eb8b17d9-9527-4cf2-86a9-f6d397b8e5c4", score: 0.78, status: "COMPLETED" },
  { a: diego, b: noah, cycle: september, id: "343ae3f5-0ba6-4a0e-bdc2-487ece59e311", score: 0.63, status: "CANCELLED" },
  // October 2026: current cycle
  { a: alex, b: taylor, cycle: october, id: "1e1efea6-99f0-469e-99ef-7d65ca8b415b", score: 0.87, status: "CONFIRMED" },
  { a: jordan, b: maya, cycle: october, id: "85818ba1-cec2-4f36-9b4a-b4c82f0677e9", score: 0.76, status: "PENDING" },
  { a: priya, b: noah, cycle: october, id: "e41d271b-ad77-4cd8-a997-b6a4580f6be7", score: 0.83, status: "PENDING" },
  { a: sam, b: hana, cycle: october, id: "e634f984-55c1-4b75-8ab2-f6f9e32fe88c", score: 0.79, status: "CONFIRMED" },
  { a: chris, b: diego, cycle: october, id: "360d317d-d7db-42c8-9d86-477549018fc7", score: 0.71, status: "PENDING" },
];

export const matchesFixture = rows.map(toListItem);

export const matchesHandlers = [
  http.get("/api/match", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const matchCycleId = params.get("matchCycleId");
    const status = params.get("status");

    const payload = matchesFixture.filter(
      (m) =>
        (!matchCycleId || m.matchCycleId === Number(matchCycleId)) &&
        (!status || m.status === status),
    );

    return HttpResponse.json({
      message: "Matches retrieved successfully",
      payload,
      success: true,
    });
  }),
  http.get("/api/admin/match_cycles", () =>
    HttpResponse.json({
      message: "Match Cycles retrieved successfully",
      // Backend orders by runAt, newest first.
      payload: [...matchCyclesFixture].reverse(),
      success: true,
    }),
  ),
  http.get("/api/admin/match_cycles/:id", ({ params }) => {
    const cycle = matchCyclesFixture.find((c) => c.id === Number(params.id));
    if (!cycle) {
      return HttpResponse.json(
        { message: "Match cycle not found", payload: null, success: false },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      message: "Match Cycle retrieved successfully",
      payload: cycle,
      success: true,
    });
  }),
];
