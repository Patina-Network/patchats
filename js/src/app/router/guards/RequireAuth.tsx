import { useSession } from "@/lib/api/useSession";
import { Center, Loader } from "@mantine/core";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Route guard: render the nested routes only for an authenticated user.
 * While the session is loading, show a spinner; if there is no session, redirect
 * to the public home (no /login page exists yet).
 */
export function RequireAuth() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!session) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
