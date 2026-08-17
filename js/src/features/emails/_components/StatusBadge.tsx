import { Badge } from "@mantine/core";

export type StatusType = "PENDING" | "PROCESSING" | "SENT" | "ERROR";

function getStatusColor(status: StatusType): string {
  switch (status) {
    case "PENDING":
      return "gray";
    case "PROCESSING":
      return "blue";
    case "SENT":
      return "green";
    case "ERROR":
      return "red";
    default:
      return "gray";
  }
}

interface StatusBadgeProps {
  status: StatusType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  return (
    <Badge color={getStatusColor(status)} size={size} variant="light">
      {status}
    </Badge>
  );
}
