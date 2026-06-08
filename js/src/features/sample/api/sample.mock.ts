import { http, HttpResponse } from "msw";

/**
 * MSW handlers for the sample domain's endpoints. Composed into the test server
 * in `lib/test/server.ts`. Excluded from the production build via tsconfig.
 */
export const sampleHandlers = [
  http.get("/api/sample/message", () =>
    HttpResponse.json({ message: "Hello from MSW" }),
  ),
];
