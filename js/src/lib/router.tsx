import RootPage from "@/app/Root.page";
import AdminPage from "@/app/user/admin/Admin.page";
import EmailsPage from "@/app/user/admin/emails/Emails.page";
import IntakeFormPage from "@/app/user/intake/IntakeForm.page";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootPage />,
    errorElement: <></> // To-do
  },
  {
    path: "/admin",
    element: <AdminPage />,
    errorElement: <></> // To-do
  },
  {
    path: "/admin/emails",
    element: <EmailsPage />,
    errorElement: <></> // To-do
  },
  {
    path: "/intake-form",
    element: <IntakeFormPage />,
    errorElement: <></> // To-do
  }
]);
