import { Anchor, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

/** Public landing page. */
export default function HomePage() {
  return (
    <Stack>
      <Title order={1}>PatChats</Title>
      <Text>
        Monthly one-on-one coffee chat pairings for the Patina Network.
      </Text>
      <Anchor component={Link} to="/signup">
        Complete the signup form
      </Anchor>
      <Anchor component={Link} to="/sample">
        Go to the app
      </Anchor>
    </Stack>
  );
}
