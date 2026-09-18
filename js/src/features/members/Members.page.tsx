import { MemberFilters, useMembers } from "@/features/members/api/useMembers";
import { AddMembersModal } from "@/features/members/components/AddMembersModal";
import { MembersFiltersForm } from "@/features/members/components/MembersFiltersForm";
import { MembersHeader } from "@/features/members/components/MembersHeader";
import { MembersTable } from "@/features/members/components/MembersTable";
import { Button, Group, Stack } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

export function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({});
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const { data: members = [] } = useMembers(filters);

  return (
    <Stack>
      <MembersHeader members={members} />
      <MembersFiltersForm setFilters={setFilters} />
      <MembersTable members={members} filters={filters} />
      <Group justify="flex-end">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsAddMembersOpen(true)}
        >
          Add members
        </Button>
      </Group>
      <AddMembersModal
        opened={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
      />
    </Stack>
  );
}
