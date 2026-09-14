import { Box, Flex, List, Mark, Stack, Text } from "@mantine/core";

/** Public landing page. */
export default function HomePage() {
  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      gap="xl"
      align="stretch"
      py="xl"
      pl={{ base: "md", sm: "xl", lg: 250 }}
      pr={{ base: "md", sm: "xl", lg: 150 }}
    >
      <Stack w={{ base: "100%", lg: 400 }} style={{ flexShrink: 0 }}>
        <Text size="28px" lh={1.25}>
          PatChats is a program where every month you will get matched with
          another Patina member and have a 30 minute video call or coffee chat!
        </Text>
        <List spacing="md" style={{ fontSize: "16px", lineHeight: 1.25 }}>
          <List.Item>
            At the end, share your socials and take a fun selfie or screenshot
            to share on the <Mark color="patina">#pat-chats</Mark> channel on
            our Discord!
          </List.Item>
          <List.Item>
            Connect with other members within the Patina network to learn more
            about each other and share our diverse backgrounds, professional
            journeys, and career insights.
          </List.Item>
          <List.Item>
            Our goal is to foster a more positive, tight-knit community where we
            can support one another in reaching our life and career aspirations
            and have some fun while we&apos;re at it!
          </List.Item>
        </List>
      </Stack>
      <Box
        visibleFrom="xs"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: "8px",
          minHeight: 0,
        }}
      >
        <div
          style={{ gridArea: "span 2 / span 2", border: "1px solid gray" }}
        />
        <div style={{ border: "1px solid gray" }} />
        <div style={{ gridColumn: "4", border: "1px solid gray" }} />
        <div style={{ border: "1px solid gray" }} />
        <div style={{ border: "1px solid gray" }} />
        <div style={{ border: "1px solid gray" }} />
        <div style={{ border: "1px solid gray" }} />
        <div
          style={{ gridArea: "span 2 / span 2", border: "1px solid gray" }}
        />
        <div style={{ gridColumn: "1", border: "1px solid gray" }} />
        <div style={{ gridColumn: "2", border: "1px solid gray" }} />
      </Box>
    </Flex>
  );
}
