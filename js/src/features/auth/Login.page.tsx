import { loginSchema, LoginFormValues } from "@/features/auth/api/schemas";
import { useRequestLink } from "@/features/auth/api/useRequestLink";
import { ApiError } from "@/lib/api/client";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { Link } from "react-router-dom";

/**
 * Passwordless login: ask for an email and request a magic link. Three states —
 * the form, "check your email" once a link is on its way, and a dead end for an
 * address with no account, which offers the only two ways forward (another
 * address, or sign up).
 */
export default function LoginPage() {
  const requestLink = useRequestLink();

  const form = useForm<LoginFormValues>({
    initialValues: { email: "" },
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
    return (
      <Stack gap="md">
        <Title order={2}>Check your email</Title>
        <Text>
          If you entered a valid address, a sign-in link is on its way to{" "}
          <Text component="span" fw={700}>
            {submittedEmail}
          </Text>
          . The link expires in 15 minutes and can only be used once.
        </Text>
        <Text c="dimmed" size="sm">
          Nothing arriving? Check your spam folder, or{" "}
          <Text
            component="button"
            type="button"
            inherit
            td="underline"
            onClick={() => requestLink.reset()}
          >
            request another link
          </Text>
          .
        </Text>
      </Stack>
    );
  }

  if (isUnregistered) {
    return (
      <Stack gap="md">
        <Title order={2}>No account for that email</Title>
        <Text>
          We couldn&apos;t find a PatChats account for{" "}
          <Text component="span" fw={700}>
            {submittedEmail}
          </Text>
          . Sign-in links are only sent to registered members.
        </Text>
        <Button onClick={() => requestLink.reset()}>
          Try a different email
        </Button>
        <Text c="dimmed" size="sm">
          Never signed up?{" "}
          <Anchor component={Link} to="/sign-up" inherit>
            Complete the sign-up form
          </Anchor>{" "}
          to join.
        </Text>
      </Stack>
    );
  }

  return (
    <Paper p="lg" withBorder>
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="md">
          <Title order={2}>Sign in to PatChats</Title>
          <Text c="dimmed" size="sm">
            Enter your email and we&apos;ll send you a sign-in link — no
            password needed.
          </Text>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            type="email"
            required
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
          <Button type="submit" loading={requestLink.isPending}>
            Email me a sign-in link
          </Button>
          <Text c="dimmed" size="sm">
            New to PatChats?{" "}
            <Anchor component={Link} to="/sign-up" inherit>
              Complete the sign-up form
            </Anchor>{" "}
            first — sign-in links are only sent to registered members.
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
