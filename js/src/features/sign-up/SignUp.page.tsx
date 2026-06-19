import { IntroText } from "@/features/sign-up/components/IntroText";
import { SignUpForm } from "@/features/sign-up/components/SignUpForm";
import { Stack, Title } from "@mantine/core";

export function SignUpPage() {
  return (
    <Stack gap="xl">
      <Title order={2}>PatChats Sign Up Form</Title>
      <IntroText />
      <SignUpForm />
    </Stack>
  );
}
