import { membersHandlers } from "@/features/members/api/members.mock";
import { sampleHandlers } from "@/features/sample/api/sample.mock";
import { setupServer } from "msw/node";

/**
 * MSW server for tests. Each domain owns its request handlers in
 * `features/<domain>/api/<domain>.mock.ts`; compose them here.
 */
export const server = setupServer(...membersHandlers, ...sampleHandlers);
