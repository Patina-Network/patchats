import { CreateMemberPayload } from "@/features/members/api/parseMemberCsv";
import { Member, membersQueryKey } from "@/features/members/api/useMembers";
import { ApiError, apiFetch, ApiResponder } from "@/lib/api/client";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function submissionErrorMessage(error: unknown, email: string): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return `The email ${email} already exists.`;
    }

    const body = error.body as Partial<ApiResponder<unknown>> | undefined;
    if (
      error.status >= 400 &&
      error.status < 500 &&
      typeof body?.message === "string" &&
      body.message.trim()
    ) {
      return body.message;
    }
  }

  return "An unknown error occurred.";
}

export function useSubmitMembers() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMembers = async (members: CreateMemberPayload[]) => {
    if (isSubmitting || members.length === 0) return;
    const payloads: CreateMemberPayload[] = members.map((member) => ({
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
    }));

    setIsSubmitting(true);
    try {
      const results = await Promise.allSettled(
        payloads.map((payload) =>
          apiFetch<ApiResponder<Member>>("/members", {
            method: "POST",
            body: JSON.stringify(payload),
          }).then((res) => {
            if (!res.success) {
              throw new ApiError(200, res.message, res);
            }
            return res.payload;
          }),
        ),
      );

      const addedCount = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      if (addedCount > 0) {
        notifications.show({
          color: "green",
          title: addedCount === 1 ? "Member added" : "Members added",
          message:
            payloads.length === 1 ?
              `${payloads[0].email} was added successfully.`
            : `${addedCount} ${addedCount === 1 ? "member was" : "members were"} added successfully.`,
        });
      }

      results.forEach((result, index) => {
        if (result.status !== "rejected") return;
        notifications.show({
          color: "red",
          title: "Member not added",
          message: submissionErrorMessage(result.reason, payloads[index].email),
        });
      });

      if (addedCount > 0) {
        await queryClient.invalidateQueries({ queryKey: membersQueryKey });
      }

      return results;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitMembers, isSubmitting };
}
