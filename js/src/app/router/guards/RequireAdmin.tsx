import { Navigate, Outlet } from "react-router-dom";

import { useSession } from "@/lib/api/useSession";

/**
 * Route guard: render the nested routes only for an admin. Assumes it is nested
 * under RequireAuth, so the session is already resolved here; non-admins are sent
 * home.
 */
export function RequireAdmin() {
  const { data: session } = useSession();

  if (!session?.isAdmin) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
