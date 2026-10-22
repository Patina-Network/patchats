import { parse } from "papaparse";
import { z } from "zod";

export const MEMBER_CSV_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "linkedInUrl",
  "introduction",
  "referralSource",
  "matchPref",
  "industryPref",
  "rolePref",
  "topics",
  "extraNotes",
] as const;

export type MemberCsvField = (typeof MEMBER_CSV_FIELDS)[number];

export type CreateMemberPayload = Record<MemberCsvField, string>;

export const REQUIRED_MEMBER_CSV_FIELDS: readonly MemberCsvField[] = [
  "firstName",
  "lastName",
  "email",
  "introduction",
];

export const OPTIONAL_MEMBER_CSV_FIELDS: readonly MemberCsvField[] =
  MEMBER_CSV_FIELDS.filter(
    (field) => !REQUIRED_MEMBER_CSV_FIELDS.includes(field),
  );

export interface ParsedMemberRow {
  errors: string[];
  rowNumber: number;
  values: CreateMemberPayload;
}

export interface MemberCsvParseResult {
  fileErrors: string[];
  rows: ParsedMemberRow[];
}

const memberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Email must be a valid address"),
  linkedInUrl: z.string(),
  introduction: z.string().min(1, "Introduction is required"),
  referralSource: z.string(),
  matchPref: z.string(),
  industryPref: z.string(),
  rolePref: z.string(),
  topics: z.string(),
  extraNotes: z.string(),
});

function emptyMember(): CreateMemberPayload {
  return Object.fromEntries(
    MEMBER_CSV_FIELDS.map((field) => [field, ""]),
  ) as CreateMemberPayload;
}

/** Parses a member CSV into the exact JSON shape accepted by POST /api/members. */
export function parseMemberCsv(csv: string): MemberCsvParseResult {
  const parsed = parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });
  const headers = parsed.meta.fields ?? [];
  const missingRequiredHeaders = REQUIRED_MEMBER_CSV_FIELDS.filter(
    (field) => !headers.includes(field),
  );
  const missingOptionalHeaders = OPTIONAL_MEMBER_CSV_FIELDS.filter(
    (field) => !headers.includes(field),
  );
  const unsupportedHeaders = headers.filter(
    (header) =>
      !MEMBER_CSV_FIELDS.some((supportedHeader) => supportedHeader === header),
  );
  const fileErrors: string[] = [];

  if (missingRequiredHeaders.length > 0) {
    fileErrors.push(
      `Missing required ${missingRequiredHeaders.length === 1 ? "header" : "headers"}: ${missingRequiredHeaders.join(", ")}`,
    );
  }

  if (missingOptionalHeaders.length > 0) {
    fileErrors.push(
      `Missing optional ${missingOptionalHeaders.length === 1 ? "header" : "headers"}: ${missingOptionalHeaders.join(", ")}`,
    );
  }

  if (unsupportedHeaders.length > 0) {
    fileErrors.push(
      `Unsupported ${unsupportedHeaders.length === 1 ? "header" : "headers"}: ${unsupportedHeaders.join(", ")}`,
    );
  }

  if (parsed.data.length === 0) {
    fileErrors.push("The CSV does not contain any member rows");
  }

  const parserErrorsByRow = new Map<number, string[]>();
  for (const error of parsed.errors) {
    if (typeof error.row !== "number") {
      fileErrors.push(error.message);
      continue;
    }
    const rowErrors = parserErrorsByRow.get(error.row) ?? [];
    rowErrors.push(error.message);
    parserErrorsByRow.set(error.row, rowErrors);
  }

  const rows = parsed.data.map((rawRow, index): ParsedMemberRow => {
    const values = emptyMember();
    for (const field of MEMBER_CSV_FIELDS) {
      values[field] = rawRow[field]?.trim() ?? "";
    }

    const validation = memberSchema.safeParse(values);
    const validationErrors =
      validation.success ?
        []
      : validation.error.issues.map((issue) => issue.message);

    return {
      errors: [...(parserErrorsByRow.get(index) ?? []), ...validationErrors],
      rowNumber: index + 2,
      values,
    };
  });

  const rowsByEmail = new Map<string, ParsedMemberRow[]>();
  for (const row of rows) {
    const email = row.values.email.toLocaleLowerCase();
    if (!email) continue;
    const matchingRows = rowsByEmail.get(email) ?? [];
    matchingRows.push(row);
    rowsByEmail.set(email, matchingRows);
  }
  for (const matchingRows of rowsByEmail.values()) {
    if (matchingRows.length < 2) continue;
    for (const row of matchingRows) {
      row.errors.push("Email is duplicated in this file");
    }
  }

  return { fileErrors, rows };
}
