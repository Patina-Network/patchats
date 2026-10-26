import { AuthCard } from "@/components/AuthCard";
import { CharacterCount } from "@/components/CharacterCount";
import { CheckEmailCard, EmailAddress } from "@/components/CheckEmailCard";
import { useRequestLink } from "@/features/auth/api/useRequestLink";
import { signUpSchema, SignUpFormValues } from "@/features/sign-up/api/schemas";
import { useSubmitSignUp } from "@/features/sign-up/api/useSubmitSignUp";
import { ApiError } from "@/lib/api/client";
import { trimValues } from "@/lib/utils/trimValues";
import {
  Alert,
  Anchor,
  Button,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { Link, useLocation, useNavigate } from "react-router-dom";

const INTRODUCTION_MAX = signUpSchema.shape.introduction.maxLength ?? undefined;
const REFERRAL_MAX = signUpSchema.shape.referralSource.maxLength ?? undefined;

/** Creates the member, then emails their first sign-in link automatically. */
export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const handedOverEmail =
    (location.state as { email?: string } | null)?.email ?? "";
  const submitSignUp = useSubmitSignUp();
  const requestLink = useRequestLink();
  const resendLink = useRequestLink();

  const form = useForm<SignUpFormValues>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: handedOverEmail,
      introduction: "",
      referralSource: "",
    },
    validate: zodResolver(signUpSchema),
    transformValues: trimValues,
  });

  const submitted = form.getTransformedValues();
  const goToLogin = () =>
    navigate("/login", { state: { email: submitted.email } });

  const handleSubmit = form.onSubmit((values) =>
    submitSignUp.mutate(values, {
      onSuccess: () => requestLink.mutate(values.email),
    }),
  );

  if (requestLink.isSuccess) {
    return (
      <CheckEmailCard
        title={`Welcome, ${submitted.firstName}!`}
        email={submitted.email}
        resend={resendLink}
      >
        <Text>
          We sent a sign-in link to <EmailAddress email={submitted.email} />.
          Open it to finish setting up your profile.
        </Text>
      </CheckEmailCard>
    );
  }

  // The account exists but the link failed, so send them to log in instead.
  if (submitSignUp.isSuccess && requestLink.isError) {
    return (
      <AuthCard title="You're signed up!">
        <Text>
          Your account was created, but we couldn&apos;t send your sign-in link
          just now.
        </Text>
        <Button size="md" fullWidth onClick={goToLogin}>
          Go to log in
        </Button>
      </AuthCard>
    );
  }

  const isDuplicate =
    submitSignUp.error instanceof ApiError && submitSignUp.error.status === 409;

  return (
    <AuthCard
      width={640}
      title="Sign up for PatChats"
      description="Join next month's coffee chats. You'll add your matching preferences after you sign in."
      footer={
        <>
          Already a member?{" "}
          <Anchor component={Link} to="/login" inherit fw={600}>
            Log in
          </Anchor>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
            <TextInput
              required
              size="md"
              label="First name"
              autoFocus
              {...form.getInputProps("firstName")}
            />
            <TextInput
              required
              size="md"
              label="Last name"
              {...form.getInputProps("lastName")}
            />
          </SimpleGrid>
          <TextInput
            required
            size="md"
            type="email"
            label="Email address"
            description="We'll send your matches here, so use one you check regularly."
            placeholder="you@example.com"
            {...form.getInputProps("email")}
          />
          <Textarea
            required
            size="md"
            label="Introduce yourself"
            description="One or two sentences in third person, for the email introducing you to your match."
            placeholder="Jane is a marketing manager who loves mentoring students."
            autosize
            minRows={3}
            maxLength={INTRODUCTION_MAX}
            inputContainer={(input) => (
              <>
                {input}
                <CharacterCount
                  value={form.getValues().introduction}
                  max={INTRODUCTION_MAX}
                />
              </>
            )}
            {...form.getInputProps("introduction")}
          />
          <TextInput
            size="md"
            label="How did you find out about us?"
            maxLength={REFERRAL_MAX}
            description="If a friend referred you, include their name."
            {...form.getInputProps("referralSource")}
          />
          {isDuplicate && (
            <Alert color="red">
              An account with this email already exists.{" "}
              <Anchor component="button" type="button" onClick={goToLogin}>
                Log in instead
              </Anchor>
            </Alert>
          )}
          {submitSignUp.isError && !isDuplicate && (
            <Alert color="red">
              {submitSignUp.error instanceof ApiError ?
                submitSignUp.error.message
              : "Couldn't sign you up. Check your connection and try again."}
            </Alert>
          )}
          <Button
            type="submit"
            size="md"
            fullWidth
            loading={submitSignUp.isPending || requestLink.isPending}
          >
            Sign up
          </Button>
        </Stack>
      </form>
    </AuthCard>
  );
}
