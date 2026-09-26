import type { CSSProperties } from "react";

import { Box, Container, Flex, List, Mark, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

const tile: CSSProperties = {
  width: "100%",
  height: "100%",
  border: "1px solid gray",
};

export default function HomePage() {
  const stacked = useMediaQuery("(max-width: 74.99em)") ?? false;
  return (
    <Container size="xl" fluid py="sm">
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
            another Patina member and have a 30 minute video call or coffee
            chat!
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
              Our goal is to foster a more positive, tight-knit community where
              we can support one another in reaching our life and career
              aspirations and have some fun while we&apos;re at it!
            </List.Item>
          </List>
        </Stack>
        <Box
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: stacked ? "1fr" : "repeat(4, 1fr)",
            gridTemplateRows: stacked ? undefined : "repeat(4, 119px)",
            gridAutoRows: stacked ? "288px" : undefined,
            gap: "8px",
            minHeight: 0,
          }}
        >
          <img
            src="https://picsum.photos/seed/patchats-1/800/800"
            alt=""
            style={{
              ...tile,
              ...(stacked ?
                { gridRow: "span 2" }
              : { gridArea: "span 2 / span 2" }),
            }}
          />
          <img
            src="https://picsum.photos/seed/patchats-2/400/400"
            alt=""
            style={tile}
          />
          <img
            src="https://picsum.photos/seed/patchats-3/400/400"
            alt=""
            style={{ ...tile, ...(stacked ? {} : { gridColumn: "4" }) }}
          />
          <img
            src="https://picsum.photos/seed/patchats-4/400/400"
            alt=""
            style={tile}
          />
          <img
            src="https://picsum.photos/seed/patchats-5/400/400"
            alt=""
            style={tile}
          />
          <img
            src="https://picsum.photos/seed/patchats-6/400/400"
            alt=""
            style={tile}
          />
          <img
            src="https://picsum.photos/seed/patchats-7/400/400"
            alt=""
            style={tile}
          />
          <img
            src="https://picsum.photos/seed/patchats-8/800/800"
            alt=""
            style={{
              ...tile,
              ...(stacked ?
                { gridRow: "span 2" }
              : { gridArea: "span 2 / span 2" }),
            }}
          />
          <img
            src="https://picsum.photos/seed/patchats-9/400/400"
            alt=""
            style={{ ...tile, ...(stacked ? {} : { gridColumn: "1" }) }}
          />
          <img
            src="https://picsum.photos/seed/patchats-10/400/400"
            alt=""
            style={{ ...tile, ...(stacked ? {} : { gridColumn: "2" }) }}
          />
        </Box>
      </Flex>
    </Container>
  );
}
