import {
  buildEmailRequest,
  renderTemplate,
  TemplateAudienceData,
} from "@/features/emails/api/buildEmailRequest";
import { PAIR_TEMPLATE } from "@/features/emails/api/EmailTemplate";
import { expect, test } from "vitest";

const audience: TemplateAudienceData = {
  audience: "matched-pairs",
  pairs: [{ firstEmail: "alice@example.com", secondEmail: "bob@example.com" }],
  users: [
    { email: "alice@example.com", intro: "Alice intro", name: "Alice" },
    { email: "bob@example.com", intro: "Bob intro", name: "Bob" },
  ],
};

test("builds one two-recipient message for each matched pair", () => {
  const request = buildEmailRequest(PAIR_TEMPLATE, audience);

  expect(request.messages).toHaveLength(1);
  expect(request.messages[0].recipients).toEqual([
    {
      email: "alice@example.com",
      variableToValue: {
        email: "alice@example.com",
        intro: "Alice intro",
        name: "Alice",
      },
    },
    {
      email: "bob@example.com",
      variableToValue: {
        email: "bob@example.com",
        intro: "Bob intro",
        name: "Bob",
      },
    },
  ]);
});

test("renders nested placeholder defaults without leaving unmatched braces", () => {
  expect(
    renderTemplate("Hi ${per1.intro: {Intro missing}}!", {
      "per1.intro": "Alice intro",
    }),
  ).toBe("Hi Alice intro!");
});
