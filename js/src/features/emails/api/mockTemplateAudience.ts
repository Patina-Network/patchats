import { TemplateAudienceData } from "@/features/emails/api/buildEmailRequest";
import {
  getTemplateAudience,
  SelectableEmailTemplateName,
} from "@/features/emails/api/EmailTemplate";

const mockUsers = [
  {
    anything: "Interested in local civic-tech projects.",
    email: "alice@example.com",
    industry: "Software engineering",
    intro: "I build community-focused software.",
    linkedIn: "https://linkedin.com/in/alice-example",
    name: "Alice",
    preferences: "Industry peers and mentors",
    topics: "Open source, mentoring, and community building",
  },
  {
    anything: "Enjoys early-morning coffee chats.",
    email: "bob@example.com",
    industry: "Product management",
    intro: "I lead product teams for public-interest tools.",
    linkedIn: "https://linkedin.com/in/bob-example",
    name: "Bob",
    preferences: "Cross-functional collaborators",
    topics: "Product strategy and career growth",
  },
  {
    anything: "Happy to meet virtually.",
    email: "carol@example.com",
    industry: "Design",
    intro: "I design accessible digital experiences.",
    linkedIn: "https://linkedin.com/in/carol-example",
    name: "Carol",
    preferences: "Design peers and founders",
    topics: "Accessibility and research",
  },
  {
    anything: "Prefers weekday afternoons.",
    email: "david@example.com",
    industry: "Data science",
    intro: "I work on data products for nonprofits.",
    linkedIn: "https://linkedin.com/in/david-example",
    name: "David",
    preferences: "Mission-driven technologists",
    topics: "Data ethics and machine learning",
  },
];

const mockPairs = [
  { firstEmail: "alice@example.com", secondEmail: "bob@example.com" },
  { firstEmail: "carol@example.com", secondEmail: "david@example.com" },
];

const wait = (durationMs: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

/** Replaced with a backend source-record query once that endpoint exists. */
export async function getMockTemplateAudience(
  templateName: SelectableEmailTemplateName,
): Promise<TemplateAudienceData> {
  await wait(150);

  return {
    audience: getTemplateAudience(templateName),
    pairs: mockPairs,
    users: mockUsers,
  };
}
