import { ProfileEditValues } from "@/features/member-profile/api/schemas";

export interface MemberProfileValues {
  firstName: string;
  lastName: string;
  email: string;
  linkedInUrl: string;
  introduction: string;
  referralSource: string;
  matchPref: string;
  industryPref: string;
  rolePref: string;
  topics: string;
  extraNotes: string;
}

/** Optional columns: the API returns NULL for any a member was never asked. */
type OptionalProfileField =
  | "linkedInUrl"
  | "referralSource"
  | "matchPref"
  | "industryPref"
  | "rolePref"
  | "topics"
  | "extraNotes";

export interface MemberProfile
  extends Omit<MemberProfileValues, OptionalProfileField>,
    Record<OptionalProfileField, string | null> {
  id: string;
  active: boolean;
  deactivationReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** API → profile form: the editable fields, with NULL as "" for the inputs. */
export function toFormValues(member: MemberProfile): ProfileEditValues {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    linkedInUrl: member.linkedInUrl ?? "",
    introduction: member.introduction,
    matchPref: member.matchPref ?? "",
    industryPref: member.industryPref ?? "",
    rolePref: member.rolePref ?? "",
    topics: member.topics ?? "",
    extraNotes: member.extraNotes ?? "",
  };
}
