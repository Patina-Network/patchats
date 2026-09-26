import patchatsLogo from "@/assets/patchats-logo.svg";
import { useLogout } from "@/features/auth/api/useLogout";
import { useSession } from "@/features/auth/api/useSession";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconShieldCheck, IconUser } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export function Navbar() {
  const logout = useLogout();
  const { data: session, isPending } = useSession();
  const isDesktop = useMediaQuery("(min-width: 48em)");

  return (
    <Container size="xl" h="100%" fluid>
      <Flex
        h="100%"
        direction="row"
        justify="space-between"
        align="center"
        gap={{ base: 6, xs: "sm" }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Box
            component="img"
            src={patchatsLogo}
            alt="Patina Network – PatChats"
            h="100%"
            mah={{ base: 56, xs: 100 }}
            w="auto"
          />
        </Link>
        <Group gap={isDesktop ? "xl" : "xs"}>
          {isPending ?
            null
          : session ?
            <>
              {session.isAdmin &&
                (isDesktop ?
                  <Badge color="red">Admin</Badge>
                : <Tooltip label="Admin" withArrow>
                    <Box
                      aria-label="Admin"
                      title="Admin"
                      bg="red"
                      c="white"
                      w={28}
                      h={28}
                      style={{
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconShieldCheck size={16} />
                    </Box>
                  </Tooltip>)}
              <Group gap="sm" wrap="nowrap">
                <ActionIcon
                  component={Link}
                  to="/profile"
                  aria-label="Profile"
                  h={{ base: 36, xs: 40 }}
                  w={{ base: 36, xs: 40 }}
                  color="white"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    borderRadius: "5px",
                  }}
                >
                  <IconUser size={20} stroke={1.8} />
                </ActionIcon>
                <Button
                  fw={400}
                  fz={{ base: 14, xs: 16 }}
                  h={{ base: 36, xs: 40 }}
                  px={{ base: 30, xs: 24 }}
                  size="compact-xs"
                  style={{
                    backgroundColor: "#60D1B7",
                    borderRadius: "5px",
                    color: "#000000",
                    fontFamily: "Figtree, sans-serif",
                  }}
                  loading={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  Logout
                </Button>
              </Group>
            </>
          : <>
              <Button
                component={Link}
                to="/sign-up"
                fw={400}
                fz={{ base: 14, xs: 16 }}
                h={{ base: 36, xs: 40 }}
                px={{ base: 16, xs: 24 }}
                style={{
                  backgroundColor: "#60D1B7",
                  borderRadius: "1px",
                  color: "#000000",
                  fontFamily: "Figtree, sans-serif",
                }}
              >
                Sign up
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="transparent"
                c="white"
                fw={400}
                fz={{ base: 14, xs: 16 }}
                h={{ base: 36, xs: 40 }}
                px={{ base: 16, xs: 24 }}
                style={{
                  fontFamily: "Figtree, sans-serif",
                }}
              >
                Log in
              </Button>
            </>
          }
        </Group>
      </Flex>
    </Container>
  );
}
