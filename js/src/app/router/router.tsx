import { AdminLayout } from "@/app/layouts/AdminLayout";
import { AppLayout } from "@/app/layouts/AppLayout";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { RequireAdmin } from "@/app/router/guards/RequireAdmin";
import { RequireAuth } from "@/app/router/guards/RequireAuth";
import AdminPage from "@/features/admin/Admin.page";
import AdminLoginPage from "@/features/admin/AdminLogin.page";
import LoginPage from "@/features/auth/Login.page";
import VerifyPage from "@/features/auth/Verify.page";
import EmailAdminPage from "@/features/emails/EmailAdminPage";
import { EmailHistoryDetailPage } from "@/features/emails/EmailHistoryDetailPage";
import { EmailHistoryPage } from "@/features/emails/EmailHistoryPage";
import { EmailProgressPage } from "@/features/emails/EmailProgressPage";
import { EmailSendPage } from "@/features/emails/EmailSendPage";
import HomePage from "@/features/home/Home.page";
import { MemberProfilePage } from "@/features/member-profile/MemberProfile.page";
import { MembersPage } from "@/features/members/Members.page";
import SamplePage from "@/features/sample/Sample.page";
import SampleAdminPage from "@/features/sample/SampleAdmin.page";
import { SignUpPage } from "@/features/sign-up/SignUp.page";
import {
  Navigate,
  createBrowserRouter,
  type RouteObject,
} from "react-router-dom";

const emailAdminTabRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="send" replace /> },
  { path: "send", element: <EmailSendPage /> },
  { path: "progress/:requestId?", element: <EmailProgressPage /> },
  { path: "history", element: <EmailHistoryPage /> },
  { path: "history/:requestId", element: <EmailHistoryDetailPage /> },
];

export const router = createBrowserRouter([
  // Public admin login: its page owns the full viewport.
  { path: "admin/login", element: <AdminLoginPage /> },

  // Public: no guard, public chrome.
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "sign-up", element: <SignUpPage /> },
      { path: "profile/:id", element: <MemberProfilePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "auth/verify", element: <VerifyPage /> },
    ],
  },
  // Temporary public email routes for TESTING (before auth is wired)
  {
    path: "email",
    element: <EmailAdminPage />,
    children: emailAdminTabRoutes,
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
              { path: "admin/members", element: <MembersPage /> },
              {
                path: "admin/email",
                element: <EmailAdminPage />,
                children: emailAdminTabRoutes,
              },
              { path: "sample/admin", element: <SampleAdminPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
