import { Member } from "@/features/members/api/useMembers";
import { Badge, Group, Stack, Text, Title } from "@mantine/core";

export function MembersHeader({ members }: { members: Member[] }) {
  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Members</Title>
          <Text c="dimmed">Everyone registered for PatChats.</Text>
        </div>
        <Badge size="lg" variant="light">
          {members.length} {members.length === 1 ? "member" : "members"}
        </Badge>
      </Group>
    </Stack>
  );
}
