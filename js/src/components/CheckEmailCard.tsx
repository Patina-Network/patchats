import { AuthCard } from "@/components/AuthCard";
import { ApiError } from "@/lib/api/client";
import { Anchor, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";

/** A second request-link mutation, so resending doesn't reset the page. */
interface ResendLink {
  mutate: (email: string) => void;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
}

/**
 * The "a sign-in link is on its way" card. The default text doesn't confirm
 * the account exists, so sign-up passes its own.
 */
export function CheckEmailCard({
  title = "Check your email",
  email,
  resend,
  children,
}: {
  title?: string;
  email: string;
  resend: ResendLink;
  children?: ReactNode;
}) {
  return (
    <AuthCard
      title={title}
      footer={<ResendFooter email={email} resend={resend} />}
    >
      <Stack gap="sm">
        {children ?? (
          <Text>
            If you entered a valid address, a sign-in link is on its way to{" "}
            <EmailAddress email={email} />.
          </Text>
        )}
        <Text c="dimmed" size="sm">
          The link expires in 15 minutes. Not in your inbox? Check your spam
          folder.
        </Text>
      </Stack>
    </AuthCard>
  );
}

/** The resend prompt. The backend's rate limit, not this, caps how many go out. */
function ResendFooter({
  email,
  resend,
}: {
  email: string;
  resend: ResendLink;
}) {
  const sendAnother = (label: string) => (
    <Anchor
      component="button"
      type="button"
      inherit
      fw={600}
      disabled={resend.isPending}
      onClick={() => resend.mutate(email)}
    >
      {resend.isPending ? "Sending…" : label}
    </Anchor>
  );

  if (resend.isSuccess) {
    return <>Another link is on its way. {sendAnother("Send again")}</>;
  }

  if (resend.error instanceof ApiError && resend.error.status === 429) {
    return (
      <>
        Too many requests. Wait a few minutes, then {sendAnother("try again")}
      </>
    );
  }

  if (resend.error) {
    return <>Couldn&apos;t send another link. {sendAnother("Try again")}</>;
  }

  return <>Didn&apos;t get it? {sendAnother("Send another link")}</>;
}

export function EmailAddress({ email }: { email: string }) {
  return (
    <Text component="span" fw={700}>
      {email}
    </Text>
  );
}
