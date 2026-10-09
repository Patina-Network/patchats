import {
  sendToEmailApi,
  sendToPreviewApi,
} from "@/features/emails/api/emailAPI";
import { server } from "@/lib/test/server";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";

test("copies the CSRF cookie into the synchronous email request header", async () => {
  document.cookie = "XSRF-TOKEN=test-csrf-token; path=/";
  let csrfHeader: string | null = null;

  server.use(
    http.post("/api/admin/email/send", ({ request }) => {
      csrfHeader = request.headers.get("X-XSRF-TOKEN");
      return HttpResponse.json({
        success: true,
        message: "Sent 1 of 1 emails",
        payload: { sent: 1, failed: 0 },
      });
    }),
  );

  const response = await sendToEmailApi({ messages: [] });

  expect(csrfHeader).toBe("test-csrf-token");
  expect(response.payload).toEqual({ sent: 1, failed: 0 });
});

test("copies the CSRF cookie into the preview request header", async () => {
  document.cookie = "XSRF-TOKEN=test-preview-token; path=/";
  let csrfHeader: string | null = null;

  server.use(
    http.post("/api/admin/email/preview", ({ request }) => {
      csrfHeader = request.headers.get("X-XSRF-TOKEN");
      return HttpResponse.json({
        success: true,
        message: "Rendered 0 emails",
        payload: { previews: [] },
      });
    }),
  );

  const previews = await sendToPreviewApi({
    templateId: "template-id",
    messages: [],
  });

  expect(csrfHeader).toBe("test-preview-token");
  expect(previews).toEqual([]);
});
