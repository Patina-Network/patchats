import { Box, Tabs } from "@mantine/core";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
type EmailAdminTabValue = "send" | "progress" | "history";
function getSelectedTab(pathname: string): EmailAdminTabValue {
  if (pathname.includes("/history")) {
    return "history";
  }
  if (pathname.includes("/progress")) {
    return "progress";
  }
  return "send";
}
export default function EmailAdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedTab = getSelectedTab(location.pathname);
  const handleTabChange = (value: string | null) => {
    navigate(value || "");
    return;
  };
  return (
    <Tabs value={selectedTab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="send">Send Emails</Tabs.Tab>
        <Tabs.Tab value="progress">Live Progress</Tabs.Tab>
        <Tabs.Tab value="history">History</Tabs.Tab>
      </Tabs.List>
      <Box pt="lg">
        <Outlet />
      </Box>
    </Tabs>
  );
}
