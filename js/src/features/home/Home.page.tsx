import type { CSSProperties } from "react";

import { Box, Flex, List, Mark, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

const tile: CSSProperties = { border: "1px solid gray" };

/** Public landing page. */
export default function HomePage() {
  const stacked = useMediaQuery("(max-width: 74.99em)") ?? false;
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
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: stacked ? "1fr" : "repeat(4, 1fr)",
          gridTemplateRows: stacked ? undefined : "repeat(4, 1fr)",
          gridAutoRows: stacked ? "192px" : undefined,
          gap: "8px",
          minHeight: 0,
        }}
      >
        <div
          style={{
            ...tile,
            ...(stacked ?
              { gridRow: "span 2" }
            : { gridArea: "span 2 / span 2" }),
          }}
        />
        <div style={tile} />
        <div style={{ ...tile, ...(stacked ? {} : { gridColumn: "4" }) }} />
        <div style={tile} />
        <div style={tile} />
        <div style={tile} />
        <div style={tile} />
        <div
          style={{
            ...tile,
            ...(stacked ?
              { gridRow: "span 2" }
            : { gridArea: "span 2 / span 2" }),
          }}
        />
        <div style={{ ...tile, ...(stacked ? {} : { gridColumn: "1" }) }} />
        <div style={{ ...tile, ...(stacked ? {} : { gridColumn: "2" }) }} />
      </Box>
    </Flex>
  );
}
