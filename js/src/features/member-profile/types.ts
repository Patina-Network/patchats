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

export interface MemberProfile extends MemberProfileValues {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toFormValues(member: MemberProfile): MemberProfileValues {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    linkedInUrl: member.linkedInUrl,
    introduction: member.introduction,
    referralSource: member.referralSource,
    matchPref: member.matchPref,
    industryPref: member.industryPref,
    rolePref: member.rolePref,
    topics: member.topics,
    extraNotes: member.extraNotes,
  };
}