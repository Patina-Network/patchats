import {
  sendToEmailApi,
  type SendRequest,
} from "@/features/emails/api/parseCSV";
import { Button, Flex } from "@mantine/core";
import { notifications } from "@mantine/notifications";

/**
 *  Button to send  emails.
 */
export function EmailSender({ request }: { request: SendRequest | null }) {
  const handleSend = async () => {
    if (!request) {
      notifications.show({
        color: "red",
        title: "Preview first",
        message: "Preview before sending.",
      });
      return;
    }
    await sendToEmailApi(request);
    notifications.show({
      color: "green",
      title: "Sent",
      message: "Emails sent.",
    });
  };
  return (
    <Flex>
      <Button fullWidth onClick={() => void handleSend()}>
        Send Emails
      </Button>
    </Flex>
  );
}
