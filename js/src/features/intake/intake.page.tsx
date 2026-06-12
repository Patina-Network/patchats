import {
  IntakeForm,
  IntakeFormValues,
} from "@/features/intake/components/IntakeForm";
import { Stack, Text, Title } from "@mantine/core";

export function IntakePage() {
  const handleSubmit = async (values: IntakeFormValues) => {
    // Replace this with a real API call or mutation once available.
    console.log("Submitted intake form", values);
  };

  return (
    <Stack gap="xl">
      <Title order={2}>PatChats Intake Form</Title>
      <Text size="lg">
        Hi everyone! Would you like to get to know other members of the Patina
        community better?
        <br />
        <br />
        PatChats is a program where every month you will get matched with
        another Patina member, and find a time between the two of you to have a
        30 minute video call or coffee chat! At the end, share your socials and
        take a fun selfie or screenshot to share on the #pat-chats channel on
        our Discord! <br />
        <br />
        Connect with other members within the Patina network to learn more about
        each other and share our diverse backgrounds, professional journeys, and
        career insights. Our goal is to foster a more positive, tight-knit
        community where we can support one another in reaching our life and
        career aspirations and have some fun while we're at it! <br />
        <br />
        Sign up here to be included in next month's cycle. We currently have 80
        people signed up and looking to keep it growing!
      </Text>
      <IntakeForm onSubmit={handleSubmit} />
    </Stack>
  );
}
