import { MemberFilters, useMembers } from "@/features/members/api/useMembers";
import { MembersFiltersForm } from "@/features/members/components/MembersFiltersForm";
import { MembersHeader } from "@/features/members/components/MembersHeader";
import { MembersTable } from "@/features/members/components/MembersTable";
import { Stack } from "@mantine/core";
import { useState } from "react";

export function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({});
  const { data: members = [] } = useMembers(filters);
  return (
    <Stack>
      <MembersHeader members={members} />
      <MembersFiltersForm setFilters={setFilters} />
      <MembersTable members={members} filters={filters} />
    </Stack>
  );
}
