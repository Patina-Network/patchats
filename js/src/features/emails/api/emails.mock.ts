import { SendEmailRequest } from "@/features/emails/api/buildEmailRequest";
import { http, HttpResponse } from "msw";

export const emailHandlers = [
  http.post("/api/email/send", async ({ request }) => {
    const requestBody = (await request.json()) as SendEmailRequest;
    const results = requestBody.messages.map((message) => ({
      error: null,
      recipients: message.recipients.map((recipient) => recipient.email),
      sent: true,
    }));

    return HttpResponse.json({
      message: `Sent ${results.length} of ${results.length} emails`,
      payload: {
        failed: 0,
        results,
        sent: results.length,
      },
      success: true,
    });
  }),
];
