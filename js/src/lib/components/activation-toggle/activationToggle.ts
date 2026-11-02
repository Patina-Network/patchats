import { rem } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { ReactNode } from "react";

/** Shared confirm-modal chrome for member activate/deactivate toggles. */
export function confirmActivationToggle({
  nextActive,
  title = nextActive ? "Reactivate member" : "Deactivate member",
  body,
  onConfirm,
}: {
  nextActive: boolean;
  title?: string;
  body: ReactNode;
  onConfirm: () => void;
}) {
  modals.openConfirmModal({
    title,
    centered: true,
    radius: "md",
    padding: rem(24),
    styles: {
      title: { fontSize: "var(--mantine-font-size-lg)", fontWeight: 600 },
    },
    children: body,
    labels: {
      confirm: nextActive ? "Reactivate" : "Deactivate",
      cancel: "Cancel",
    },
    groupProps: { mt: rem(24) },
    // Focus the safe choice on open, not the close button.
    cancelProps: { "data-autofocus": "true" },
    confirmProps: { color: nextActive ? undefined : "red" },
    onConfirm,
  });
}

export function notifyActivationToggleSuccess(
  nextActive: boolean,
  message: string,
  title = nextActive ? "Member reactivated" : "Member deactivated",
) {
  notifications.show({
    color: "green",
    message,
    title,
  });
}
