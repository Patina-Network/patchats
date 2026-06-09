import { Loader, Stack, Text, Title } from "@mantine/core";

import { useSampleMessage } from "@/features/sample/api/useSampleMessage";

/** Sample authenticated page — demonstrates the feature + data-layer pattern. */
export default function SamplePage() {
  const { data, isError, isPending } = useSampleMessage();

  return (
    <Stack>
      <Title order={2}>Sample feature</Title>
      {isPending && <Loader />}
      {isError && <Text c="red">Failed to load message.</Text>}
      {data && <Text>{data.message}</Text>}
    </Stack>
  );
}
