import { Button, Stack } from "@mantine/core";

export function ActivationToggleButton({
  active,
  loading,
  onClick,
}: {
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Stack>
      <Button
        color={active ? "red" : "green"}
        loading={loading}
        onClick={onClick}
        size="xs"
        variant="light"
      >
        {active ? "Deactivate" : "Reactivate"}
      </Button>
    </Stack>
  );
}
