import { Text } from "@mantine/core";

export function CharacterCount({
  value,
  max,
}: {
  value: string;
  max?: number;
}) {
  return (
    <Text size="xs" c="dimmed" ta="right" mt="xs">
      {value.length} / {max}
    </Text>
  );
}
