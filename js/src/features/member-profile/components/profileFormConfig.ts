const MATCH_PREFS = [
  "Mentor - I am looking for guidance from someone with more experience",
  "Mentee - I am looking to provide guidance to someone with less experience",
  "Peer - I am looking for someone at a similar level",
  "No Preference - I am open to any type of match",
] as const;

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Business",
  "Design",
  "Other",
  "No Preference",
] as const;

export interface Choice {
  /** The exact string saved, which matching and the admin views read. */
  value: string;
  label: string;
  detail?: string;
}

/** "Mentor - I am looking for…" → an option labelled "Mentor" with the rest below. */
export function toChoice(value: string): Choice {
  const [label, ...detail] = value.split(" - ");
  return { value, label, detail: detail.join(" - ") || undefined };
}

export const MATCH_CHOICES = MATCH_PREFS.map(toChoice);
export const INDUSTRY_CHOICES = INDUSTRIES.map(toChoice);
