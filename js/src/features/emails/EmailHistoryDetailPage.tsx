import { EmailHistory } from "@/features/emails/_components/EmailHistory";
import { useNavigate, useParams } from "react-router-dom";

export function EmailHistoryDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  return (
    <EmailHistory
      detailRequestId={requestId ?? null}
      onBack={() => navigate("../history")}
    />
  );
}
