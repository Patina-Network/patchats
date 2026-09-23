import { AppLayout } from "@/app/layouts/AppLayout";
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
import { MyProfilePage } from "@/features/member-profile/MyProfile.page";
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
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "sign-up", element: <SignUpPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "auth/verify", element: <VerifyPage /> },
      { path: "admin/login", element: <AdminLoginPage /> },
      {
        path: "email",
        element: <EmailAdminPage />,
        children: emailAdminTabRoutes,
      },
      {
        element: <RequireAuth />,
        children: [
          { path: "sample", element: <SamplePage /> },
          { path: "profile", element: <MyProfilePage /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: "admin", element: <AdminPage /> },
              { path: "admin/members", element: <MembersPage /> },
              { path: "admin/members/:id", element: <MemberProfilePage /> },
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
