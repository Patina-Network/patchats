import { CharacterCount } from "@/components/CharacterCount";
import {
  profileEditSchema,
  ProfileEditValues,
} from "@/features/member-profile/api/schemas";
import { useMemberProfile } from "@/features/member-profile/api/useMemberProfile";
import { useUpdateMemberProfile } from "@/features/member-profile/api/useUpdateMemberProfile";
import {
  Choice,
  INDUSTRY_CHOICES,
  MATCH_CHOICES,
  toChoice,
} from "@/features/member-profile/components/profileFormConfig";
import { SelfActivationToggle } from "@/features/member-profile/components/SelfActivationToggle";
import { MemberProfile, toFormValues } from "@/features/member-profile/types";
import { normalizeLinkedInUrl } from "@/features/member-profile/utils";
import { trimValues } from "@/lib/utils/trimValues";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Flex,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { ReactNode, useId, useState } from "react";

const INTRODUCTION_MAX =
  profileEditSchema.shape.introduction.maxLength ?? undefined;
const ROLE_MAX = profileEditSchema.shape.rolePref.maxLength ?? undefined;
const TOPICS_MAX = profileEditSchema.shape.topics.maxLength ?? undefined;
const EXTRA_NOTES_MAX =
  profileEditSchema.shape.extraNotes.maxLength ?? undefined;

/** Only real LinkedIn profile URLs become links; anything else shows as text. */
const LINKEDIN_URL = /^https:\/\/(www\.)?linkedin\.com\/in\//;

const validateProfile = zodResolver(profileEditSchema);

/** Keeps a stored answer that isn't one of the options visible, not blank. */
function withCurrent(options: Choice[], current: string) {
  return current && !options.some((option) => option.value === current) ?
      [...options, { value: current, label: current }]
    : options;
}

export function MemberProfileForm({
  id,
  title,
  showActivationToggle = false,
}: {
  id: string;
  title: string;
  showActivationToggle?: boolean;
}) {
  const { data: member, isLoading, isError } = useMemberProfile(id);
  const updateMutation = useUpdateMemberProfile(id);
  const formId = useId();
  const [isEditing, setIsEditing] = useState(false);

  const stopEditing = () => {
    updateMutation.reset();
    setIsEditing(false);
  };

  if (isLoading) return <Loader />;
  if (isError || !member)
    return <Alert color="red">Failed to load profile.</Alert>;

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={2} size="h3">
            {title}
          </Title>
          {isEditing ?
            <Group gap="sm">
              <Button
                variant="default"
                onClick={stopEditing}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form={formId}
                loading={updateMutation.isPending}
              >
                Save
              </Button>
            </Group>
          : <Button variant="default" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          }
        </Group>
        {isEditing ?
          <ProfileEditForm
            member={member}
            formId={formId}
            updateMutation={updateMutation}
            onDone={stopEditing}
          />
        : <ProfileDetails member={member} />}
        {showActivationToggle && <MatchingStatus member={member} />}
      </Stack>
    </Container>
  );
}

function ProfileDetails({ member }: { member: MemberProfile }) {
  const linkedIn = member.linkedInUrl;

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Section title="About">
        <Detail label="Name">
          {member.firstName} {member.lastName}
        </Detail>
        <Detail label="Email">{member.email}</Detail>
        <Detail label="LinkedIn">
          {linkedIn && LINKEDIN_URL.test(linkedIn) ?
            <Anchor href={linkedIn} target="_blank" rel="noreferrer">
              {linkedIn.replace(/^https:\/\/(www\.)?/, "")}
            </Anchor>
          : linkedIn}
        </Detail>
        <Detail label="Introduction">{member.introduction}</Detail>
        <Detail label="Heard about us from">{member.referralSource}</Detail>
      </Section>
      <Section title="Matching">
        <Detail label="Match type">
          {member.matchPref && toChoice(member.matchPref).label}
        </Detail>
        <Detail label="Industry">{member.industryPref}</Detail>
        <Detail label="Roles to meet">{member.rolePref}</Detail>
        <Detail label="Topics">{member.topics}</Detail>
        <Detail label="Anything else">{member.extraNotes}</Detail>
      </Section>
    </SimpleGrid>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Flex
      direction={{ base: "column", xs: "row" }}
      align={{ xs: "baseline" }}
      columnGap="md"
      rowGap={4}
    >
      <Text c="dimmed" size="sm" w={{ xs: 140 }} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      {children ?
        <Text style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {children}
        </Text>
      : <Text c="dimmed">Not set</Text>}
    </Flex>
  );
}

function ProfileEditForm({
  member,
  formId,
  updateMutation,
  onDone,
}: {
  member: MemberProfile;
  formId: string;
  updateMutation: ReturnType<typeof useUpdateMemberProfile>;
  onDone: () => void;
}) {
  const initialValues = toFormValues(member);

  const form = useForm<ProfileEditValues>({
    initialValues,
    // "linkedin.com/in/you" is accepted as shorthand, so check the full URL.
    validate: (values) =>
      validateProfile({
        ...values,
        linkedInUrl: normalizeLinkedInUrl(values.linkedInUrl),
      }),
    transformValues: (values) => ({
      ...trimValues(values),
      linkedInUrl: normalizeLinkedInUrl(values.linkedInUrl),
    }),
  });

  const handleSubmit = form.onSubmit((values) =>
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({
          color: "green",
          title: "Profile saved",
          message: "Changes apply from the next matching cycle.",
        });
        onDone();
      },
    }),
  );

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Section title="About">
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
              <TextInput
                required
                size="md"
                label="First name"
                {...form.getInputProps("firstName")}
              />
              <TextInput
                required
                size="md"
                label="Last name"
                {...form.getInputProps("lastName")}
              />
            </SimpleGrid>
            <TextInput
              size="md"
              label="LinkedIn"
              description="So your match can look you up before you meet."
              placeholder="linkedin.com/in/your-name"
              {...form.getInputProps("linkedInUrl")}
            />
            <Textarea
              required
              size="md"
              label="Introduce yourself"
              description="One or two sentences in third person, for the email introducing you to your match."
              autosize
              minRows={3}
              maxLength={INTRODUCTION_MAX}
              inputContainer={(input) => (
                <>
                  {input}
                  <CharacterCount
                    value={form.getValues().introduction}
                    max={INTRODUCTION_MAX}
                  />
                </>
              )}
              {...form.getInputProps("introduction")}
            />
          </Section>
          <Section title="Matching">
            <Select
              size="md"
              label="What kind of match are you looking for?"
              placeholder="Not set"
              data={withCurrent(MATCH_CHOICES, initialValues.matchPref)}
              allowDeselect={false}
              renderOption={({ option }) => {
                const { label, detail } = toChoice(option.value);
                return (
                  <div>
                    <Text size="sm">{label}</Text>
                    <Text size="xs" c="dimmed">
                      {detail}
                    </Text>
                  </div>
                );
              }}
              {...form.getInputProps("matchPref")}
            />
            <Select
              size="md"
              label="What industry are you in, or hoping to get into?"
              placeholder="Not set"
              data={withCurrent(INDUSTRY_CHOICES, initialValues.industryPref)}
              allowDeselect={false}
              {...form.getInputProps("industryPref")}
            />
            <TextInput
              size="md"
              label="What roles would you like to meet?"
              placeholder="e.g. designers, data scientists"
              maxLength={ROLE_MAX}
              {...form.getInputProps("rolePref")}
            />
            <TextInput
              size="md"
              label="What would you like to talk about?"
              placeholder="e.g. switching careers"
              maxLength={TOPICS_MAX}
              {...form.getInputProps("topics")}
            />
            <Textarea
              size="md"
              label="Anything else we should know when matching you?"
              placeholder="e.g. I'm free most weekday evenings"
              autosize
              minRows={2}
              maxLength={EXTRA_NOTES_MAX}
              {...form.getInputProps("extraNotes")}
            />
          </Section>
        </SimpleGrid>
        {updateMutation.isError && (
          <Alert color="red">
            Couldn&apos;t save your changes. Check your connection and try
            again.
          </Alert>
        )}
      </Stack>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper p={{ base: "lg", xs: "xl" }} radius="md" withBorder>
      <Stack gap="md">
        <Title order={3} size="h4">
          {title}
        </Title>
        {children}
      </Stack>
    </Paper>
  );
}

function MatchingStatus({ member }: { member: MemberProfile }) {
  return (
    <Paper p={{ base: "lg", xs: "xl" }} radius="md" withBorder>
      <Group justify="space-between" wrap="nowrap">
        <Stack gap="xs">
          <Text fw={600}>
            {member.active ?
              "You're in next month's matching"
            : "Matching is paused"}
          </Text>
          <Text c="dimmed" size="sm">
            {member.active ?
              "Taking a break? Deactivate to skip matching until you're back."
            : "Reactivate to be included in the next matching cycle."}
          </Text>
        </Stack>
        <SelfActivationToggle member={member} />
      </Group>
    </Paper>
  );
}
