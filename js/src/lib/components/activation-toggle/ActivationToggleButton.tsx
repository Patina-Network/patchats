import { Button, MantineSize } from "@mantine/core";

export function ActivationToggleButton({
  active,
  loading,
  onClick,
  size = "xs",
}: {
  active: boolean;
  loading: boolean;
  onClick: () => void;
  size?: MantineSize;
}) {
  return (
    <Button
      color={active ? "red" : "green"}
      loading={loading}
      onClick={onClick}
      size={size}
      variant="light"
    >
      {active ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
