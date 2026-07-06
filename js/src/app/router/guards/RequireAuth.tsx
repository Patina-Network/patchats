import { useSession } from "@/features/auth/api/useSession";
import { Center, Loader } from "@mantine/core";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Route guard: render the nested routes only for an authenticated member.
 * While the session is loading, show a spinner; signed-out visitors go to the
 * login page.
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
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
