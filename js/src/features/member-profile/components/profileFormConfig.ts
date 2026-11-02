import {
  INDUSTRIES,
  MATCH_PREFS,
} from "@/features/member-profile/api/memberProfileOptions";

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
