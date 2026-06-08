import AdminEmailComposerPage from "@/features/emails/AdminEmailComposer.page";
import {
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "@/lib/test/render";
import { server } from "@/lib/test/server";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";

async function selectTemplate(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getByPlaceholderText("Select email template"));
  await user.click(await screen.findByText(name));
  await screen.findByText("4 recipients");
}

test("requires a template before opening confirmation", async () => {
  const user = userEvent.setup();

  renderWithProviders(<AdminEmailComposerPage />);

  await user.click(screen.getByRole("button", { name: /review send/i }));

  expect(
    await screen.findByText("Email template is required"),
  ).toBeInTheDocument();
});

test("renders a paired template and sends its backend batch payload", async () => {
  const user = userEvent.setup();

  renderWithProviders(<AdminEmailComposerPage />);

  await selectTemplate(user, "Pair");

  expect(screen.getAllByText("Matched users")).toHaveLength(2);
  expect(screen.getByText("4 recipients")).toBeInTheDocument();
  expect(screen.getByLabelText("Plain text body")).toHaveAttribute("readonly");
  expect(screen.getAllByText(/Alice and Bob/)).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: /review send/i }));

  const dialog = await screen.findByRole("dialog", { name: /confirm send/i });

  expect(within(dialog).getByText("Matched users")).toBeInTheDocument();
  expect(within(dialog).getByText("4")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /send email/i }));

  expect(await screen.findByText("Email send complete")).toBeInTheDocument();
  expect(screen.getByText("Sent 2, failed 0")).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText("Confirm send")).not.toBeInTheDocument();
  });
});

test("shows failed recipient addresses returned by the backend", async () => {
  const user = userEvent.setup();

  server.use(
    http.post("/api/email/send", () =>
      HttpResponse.json({
        message: "Sent 1 of 2 emails",
        payload: {
          failed: 1,
          results: [
            {
              error: null,
              recipients: ["alice@example.com", "bob@example.com"],
              sent: true,
            },
            {
              error: "Mailbox unavailable",
              recipients: ["carol@example.com", "david@example.com"],
              sent: false,
            },
          ],
          sent: 1,
        },
        success: true,
      }),
    ),
  );

  renderWithProviders(<AdminEmailComposerPage />);

  await selectTemplate(user, "Pair");
  await user.click(screen.getByRole("button", { name: /review send/i }));
  await user.click(await screen.findByRole("button", { name: /send email/i }));

  expect(
    await screen.findByText("Email send completed with failures"),
  ).toBeInTheDocument();
  expect(screen.getByText("Sent 1, failed 1")).toBeInTheDocument();
  expect(
    screen.getByText(
      /carol@example.com, david@example.com: Mailbox unavailable/,
    ),
  ).toBeInTheDocument();
});
