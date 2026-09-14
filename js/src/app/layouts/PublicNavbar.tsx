import patchatsLogo from "@/assets/patchats-logo.svg";
import { Box, Button, Container, Flex, Group } from "@mantine/core";
import { Link } from "react-router-dom";

export function PublicNavbar() {
  return (
    <Container size="xl" h="100%" fluid>
      <Flex
        h="100%"
        direction={{ base: "column", xs: "row" }}
        justify={{ base: "flex-start", xs: "space-between" }}
        align={{ base: "flex-start", xs: "center" }}
        gap={{ base: 6, xs: "sm" }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box
            component="img"
            src={patchatsLogo}
            alt="Patina Network – PatChats"
            h={{ base: 56, xs: 100 }}
            w="auto"
          />
        </Link>
        <Group gap="sm">
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
        </Group>
      </Flex>
    </Container>
  );
}
