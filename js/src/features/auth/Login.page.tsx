import { AuthCard } from "@/components/AuthCard";
import { CheckEmailCard, EmailAddress } from "@/components/CheckEmailCard";
import { loginSchema, LoginFormValues } from "@/features/auth/api/schemas";
import { useRequestLink } from "@/features/auth/api/useRequestLink";
import { ApiError } from "@/lib/api/client";
import { Alert, Anchor, Button, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { Link, useLocation } from "react-router-dom";

/**
 * Passwordless login: ask for an email and request a magic link. Three states —
 * the form, "check your email" once a link is on its way, and a dead end for an
 * address with no account, which offers the only two ways forward (another
 * address, or sign up).
 */
export default function LoginPage() {
  const requestLink = useRequestLink();
  const resendLink = useRequestLink();
  const location = useLocation();
  const handedOverEmail =
    (location.state as { email?: string } | null)?.email ?? "";

  const form = useForm<LoginFormValues>({
    initialValues: { email: handedOverEmail },
    validate: zodResolver(loginSchema),
  });

  const submittedEmail = form.getValues().email.trim();

  const handleSubmit = form.onSubmit((values) => {
    requestLink.mutate(values.email.trim());
  });

  /** The backend 404s an email with no member row; every other failure falls
   * through to the alert inside the form. */
  const isUnregistered =
    requestLink.error instanceof ApiError && requestLink.error.status === 404;

  if (requestLink.isSuccess) {
    return <CheckEmailCard email={submittedEmail} resend={resendLink} />;
  }

  if (isUnregistered) {
    return (
      <AuthCard
        title="No account for that email"
        footer={
          <>
            Never signed up?{" "}
            <Anchor
              component={Link}
              to="/sign-up"
              state={{ email: submittedEmail }}
              inherit
            >
              Complete the sign-up form
            </Anchor>{" "}
            to join.
          </>
        }
      >
        <Text>
          We couldn&apos;t find a PatChats account for{" "}
          <EmailAddress email={submittedEmail} />. Sign-in links are only sent
          to registered members.
        </Text>
        <Button size="md" fullWidth onClick={() => requestLink.reset()}>
          Try a different email
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Log in to PatChats"
      description="Enter your email and we'll send you a sign-in link. No password needed."
      footer={
        <>
          No account?{" "}
          <Anchor component={Link} to="/sign-up" inherit fw={600}>
            Sign up
          </Anchor>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            type="email"
            size="md"
            required
            withAsterisk={false}
            autoFocus
            {...form.getInputProps("email")}
          />
          {requestLink.isError && (
            <Alert color="red">
              {(
                requestLink.error instanceof ApiError &&
                requestLink.error.status === 429
              ) ?
                requestLink.error.message
              : "Something went wrong sending your link. Please try again."}
            </Alert>
          )}
          <Button
            type="submit"
            size="md"
            fullWidth
            loading={requestLink.isPending}
          >
            Email me a sign-in link
          </Button>
        </Stack>
      </form>
    </AuthCard>
  );
}
