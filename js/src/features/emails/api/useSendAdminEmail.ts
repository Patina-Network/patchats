import {
  SendEmailRequest,
  SendEmailResponse,
} from "@/features/emails/api/buildEmailRequest";
import { ApiError, apiFetch } from "@/lib/api/client";
import { useMutation } from "@tanstack/react-query";

interface ApiResponse<T> {
  message: string;
  payload: T | null;
  success: boolean;
}

async function sendAdminEmail(request: SendEmailRequest) {
  const response = await apiFetch<ApiResponse<SendEmailResponse>>(
    "/email/send",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (!response.success || !response.payload) {
    throw new ApiError(500, response.message || "Email send failed");
  }

  return response.payload;
}

export function useSendAdminEmail() {
  return useMutation<SendEmailResponse, Error, SendEmailRequest>({
    mutationFn: sendAdminEmail,
  });
}
