import patchatsLogo from "@/assets/patchats-logo.svg";
import { Button, Container, Group } from "@mantine/core";
import { Link } from "react-router-dom";

export function PublicNavbar() {
  return (
    <Container size="xl" h="100%" fluid>
      <Group h="100%" justify="space-between" align="center">
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={patchatsLogo}
            alt="Patina Network – PatChats"
            height={100}
          />
        </Link>
        <Group gap="sm">
          <Button
            component={Link}
            to="/sign-up"
            fw={400}
            fz={16}
            style={{
              backgroundColor: "#60D1B7",
              borderRadius: "1px",
              color: "#000000",
              fontFamily: "Figtree, sans-serif",
              height: "40px",
              minWidth: "100px",
              padding: "10px 24px",
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
            fz={16}
            style={{
              fontFamily: "Figtree, sans-serif",
              height: "40px",
              minWidth: "100px",
              padding: "10px 24px",
            }}
          >
            Log in
          </Button>
        </Group>
      </Group>
    </Container>
  );
}
