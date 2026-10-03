import type { CSSProperties } from "react";

import coffeeChatPhoto1 from "@/assets/coffee-chat-pics/coffee-chat-01.jpg";
import coffeeChatPhoto2 from "@/assets/coffee-chat-pics/coffee-chat-02.jpg";
import coffeeChatPhoto3 from "@/assets/coffee-chat-pics/coffee-chat-03.jpg";
import coffeeChatPhoto4 from "@/assets/coffee-chat-pics/coffee-chat-04.jpg";
import coffeeChatPhoto5 from "@/assets/coffee-chat-pics/coffee-chat-05.jpg";
import coffeeChatPhoto6 from "@/assets/coffee-chat-pics/coffee-chat-06.jpg";
import coffeeChatPhoto7 from "@/assets/coffee-chat-pics/coffee-chat-07.jpg";
import coffeeChatPhoto8 from "@/assets/coffee-chat-pics/coffee-chat-08.jpg";
import coffeeChatPhoto9 from "@/assets/coffee-chat-pics/coffee-chat-09.jpg";
import coffeeChatPhoto10 from "@/assets/coffee-chat-pics/coffee-chat-10.jpg";
import {
  Box,
  Container,
  Flex,
  List,
  Mark,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

const tile: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "block",
  objectFit: "cover",
  border: "1px solid gray",
};

interface GalleryPhoto {
  src: string;
  alt: string;
  objectPosition: string;
  showOnMobile?: boolean;
  large?: boolean;
  desktopColumn?: string;
}

const galleryPhotos: GalleryPhoto[] = [
  {
    src: coffeeChatPhoto2,
    alt: "A group of Patina members meeting over a meal",
    objectPosition: "50% 45%",
    showOnMobile: true,
    large: true,
  },
  {
    src: coffeeChatPhoto3,
    alt: "Two Patina members taking a selfie at a cafe",
    objectPosition: "40% 40%",
  },
  {
    src: coffeeChatPhoto9,
    alt: "Two Patina members sharing coffee at a cafe",
    objectPosition: "50% 45%",
    desktopColumn: "4",
  },
  {
    src: coffeeChatPhoto1,
    alt: "Patina members sharing a meal during a PatChat",
    objectPosition: "40% 45%",
    showOnMobile: true,
  },
  {
    src: coffeeChatPhoto6,
    alt: "Two Patina members chatting at a cafe table",
    objectPosition: "45% 40%",
  },
  {
    src: coffeeChatPhoto7,
    alt: "Two Patina members posing beside a sculpture",
    objectPosition: "35% 45%",
  },
  {
    src: coffeeChatPhoto8,
    alt: "Two Patina members taking a selfie at a coffee bar",
    objectPosition: "60% 40%",
  },
  {
    src: coffeeChatPhoto5,
    alt: "Three Patina members enjoying drinks outdoors",
    objectPosition: "50% 50%",
    showOnMobile: true,
    large: true,
  },
  {
    src: coffeeChatPhoto4,
    alt: "Two Patina members meeting at a coffee shop",
    objectPosition: "50% 50%",
    desktopColumn: "1",
  },
  {
    src: coffeeChatPhoto10,
    alt: "Two Patina members taking a selfie outdoors",
    objectPosition: "50% 50%",
    desktopColumn: "2",
  },
];

function getPhotoLayout(
  photo: GalleryPhoto,
  isMobile: boolean,
  isStacked: boolean,
): CSSProperties {
  if (isMobile) {
    return {
      height: "auto",
      aspectRatio: "4 / 3",
      borderRadius: "var(--mantine-radius-md)",
    };
  }

  if (photo.large) {
    if (isStacked) {
      return { gridRow: "span 2" };
    }

    return { gridArea: "span 2 / span 2" };
  }

  if (!isStacked && photo.desktopColumn) {
    return { gridColumn: photo.desktopColumn };
  }

  return {};
}

export default function HomePage() {
  const theme = useMantineTheme();
  const isStacked = !useMediaQuery(
    `(min-width: ${theme.breakpoints.lg})`,
    undefined,
    { getInitialValueInEffect: false },
  );
  const isMobile = !useMediaQuery(
    `(min-width: ${theme.breakpoints.sm})`,
    undefined,
    { getInitialValueInEffect: false },
  );
  const visiblePhotos =
    isMobile ?
      galleryPhotos.filter((photo) => photo.showOnMobile)
    : galleryPhotos;

  return (
    <Container size="xl" fluid py="sm">
      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={{ base: "lg", sm: "xl" }}
        align="stretch"
        py={{ base: "md", sm: "xl" }}
        pl={{ base: "md", sm: "xl", lg: 250 }}
        pr={{ base: "md", sm: "xl", lg: 150 }}
      >
        <Stack w={{ base: "100%", lg: 400 }} style={{ flexShrink: 0 }}>
          <Text fz={{ base: "22px", sm: "28px" }} lh={1.25}>
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
            gridTemplateColumns: isStacked ? "1fr" : "repeat(4, 1fr)",
            gridTemplateRows: isStacked ? undefined : "repeat(4, 119px)",
            gridAutoRows:
              isMobile ? "auto"
              : isStacked ? "288px"
              : undefined,
            gap: isMobile ? "12px" : "8px",
            width: "100%",
            maxWidth: isMobile ? "560px" : undefined,
            alignSelf: isMobile ? "center" : undefined,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {visiblePhotos.map((photo, index) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              loading={index === 0 ? "eager" : "lazy"}
              style={{
                ...tile,
                objectPosition: isMobile ? "center" : photo.objectPosition,
                ...getPhotoLayout(photo, isMobile, isStacked),
              }}
            />
          ))}
        </Box>
      </Flex>
    </Container>
  );
}
