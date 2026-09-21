import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { ReactNode } from "react";

/** Shared confirm-modal chrome for member activate/deactivate toggles. */
export function confirmActivationToggle({
  nextActive,
  body,
  onConfirm,
}: {
  nextActive: boolean;
  body: ReactNode;
  onConfirm: () => void;
}) {
  modals.openConfirmModal({
    title: nextActive ? "Reactivate member" : "Deactivate member",
    children: body,
    labels: {
      confirm: nextActive ? "Reactivate" : "Deactivate",
      cancel: "Cancel",
    },
    confirmProps: { color: nextActive ? "green" : "red" },
    onConfirm,
  });
}

export function notifyActivationToggleSuccess(
  nextActive: boolean,
  message: string,
) {
  notifications.show({
    color: "green",
    message,
    title: nextActive ? "Member reactivated" : "Member deactivated",
  });
}
