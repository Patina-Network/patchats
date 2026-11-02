/** Accepts "linkedin.com/in/you" as shorthand for the full https URL. */
export function normalizeLinkedInUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("linkedin.com/in/") && !trimmed.startsWith("http")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * The walkthrough's questions, one-click ones first so the most useful answers
 * are saved even if a member stops early. The rest are on the profile page.
 */
export const WALKTHROUGH_FIELDS = [
  "matchPref",
  "industryPref",
  "topics",
  "linkedInUrl",
] as const;

export type WalkthroughField = (typeof WALKTHROUGH_FIELDS)[number];
