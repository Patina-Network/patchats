import { Container } from "@mantine/core";
import { Outlet } from "react-router-dom";

/** Chrome for public (unauthenticated) pages, e.g. landing and login. */
export function PublicLayout() {
  return (
    <Container py="xl" size="sm">
      <Outlet />
    </Container>
  );
}
