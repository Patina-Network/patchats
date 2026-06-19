import { AdminLayout } from "@/app/layouts/AdminLayout";
import { AppLayout } from "@/app/layouts/AppLayout";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { RequireAdmin } from "@/app/router/guards/RequireAdmin";
import { RequireAuth } from "@/app/router/guards/RequireAuth";
import AdminPage from "@/features/admin/Admin.page";
import AdminLoginPage from "@/features/admin/AdminLogin.page";
import EmailAdminPage from "@/features/emails/EmailAdminPage";
import HomePage from "@/features/home/Home.page";
import SamplePage from "@/features/sample/Sample.page";
import SampleAdminPage from "@/features/sample/SampleAdmin.page";
import { SignUpPage } from "@/features/sign-up/SignUp.page";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  // Public admin login: its page owns the full viewport.
  { path: "admin/login", element: <AdminLoginPage /> },

  // Public: no guard, public chrome.
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "sign-up", element: <SignUpPage /> },
    ],
  },

  // Authenticated: guard -> layout -> page. Admin nests a second guard + layout.
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: "sample", element: <SamplePage /> }],
      },
      {
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "admin", element: <AdminPage /> },
              { path: "sample/admin", element: <SampleAdminPage /> },
              { path: "sample/admin/email", element: <EmailAdminPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
