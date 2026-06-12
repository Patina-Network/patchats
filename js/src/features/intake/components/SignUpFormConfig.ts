export const MATCHING_PREFERENCES = [
  "Mentor",
  "Mentee",
  "Peer",
  "No Preference",
] as const;

export const TALKING_POINTS = [
  "Career journey",
  "Advice",
  "Current events",
  "Hobbies",
  "Other",
] as const;

export const INDUSTRIES = [
  {
    name: "Technology",
    roles: [
      "Software Engineering",
      "Data Analytics",
      "Artificial Intelligence",
      "Undecided",
      "Other",
    ],
  },
  {
    name: "Finance",
    roles: ["Accounting", "Investment Banking", "Other"],
  },
  {
    name: "Business",
    roles: ["Consulting", "Product Management", "Other"],
  },
  {
    name: "Design",
    roles: [],
  },
  {
    name: "Other",
    roles: [],
  },
] as const;
