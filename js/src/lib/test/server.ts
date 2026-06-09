import { setupServer } from "msw/node";

import { sampleHandlers } from "@/features/sample/api/sample.mock";

/**
 * MSW server for tests. Each domain owns its request handlers in
 * `features/<domain>/api/<domain>.mock.ts`; compose them here.
 */
export const server = setupServer(...sampleHandlers);
