import { EmailHistory } from "@/features/emails/_components/EmailHistory";
import { useNavigate } from "react-router-dom";

export function EmailHistoryPage() {
  const navigate = useNavigate();

  return <EmailHistory onSelectRequest={(requestId) => navigate(requestId)} />;
}
