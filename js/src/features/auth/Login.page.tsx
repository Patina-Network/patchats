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
 * Passwordless login: ask for an email, request a magic link, and show the
 * same "check your email" panel no matter what — account existence is never
 * revealed here.
 */
export default function LoginPage() {
  const requestLink = useRequestLink();

  const form = useForm<LoginFormValues>({
    initialValues: { email: "" },
    validate: zodResolver(loginSchema),
  });

  const handleSubmit = form.onSubmit((values) => {
    requestLink.mutate(values.email.trim());
  });

  if (requestLink.isSuccess) {
    return (
      <Stack gap="md">
        <Title order={2}>Check your email</Title>
        <Text>
          If you entered a valid address, a sign-in link is on its way to{" "}
          <Text component="span" fw={700}>
            {form.getValues().email.trim()}
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
