import { profileEditSchema } from "@/features/member-profile/api/schemas";
import { useUpdateMemberProfile } from "@/features/member-profile/api/useUpdateMemberProfile";
import {
  Choice,
  INDUSTRY_CHOICES,
  MATCH_CHOICES,
} from "@/features/member-profile/components/profileFormConfig";
import { MemberProfile } from "@/features/member-profile/types";
import {
  normalizeLinkedInUrl,
  WALKTHROUGH_FIELDS,
  WalkthroughField,
} from "@/features/member-profile/utils";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Progress,
  Radio,
  rem,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { ReactNode, useEffect, useId, useRef, useState } from "react";

type Question =
  | {
      kind: "text";
      title: string;
      hint?: string;
      placeholder?: string;
      maxLength?: number;
    }
  | {
      kind: "choice";
      title: string;
      choices: Choice[];
      columns: 1 | 2;
    };

const QUESTIONS: Record<WalkthroughField, Question> = {
  matchPref: {
    kind: "choice",
    title: "What kind of match are you looking for?",
    choices: MATCH_CHOICES,
    columns: 1,
  },
  industryPref: {
    kind: "choice",
    title: "What industry are you in, or hoping to get into?",
    choices: INDUSTRY_CHOICES,
    columns: 2,
  },
  topics: {
    kind: "text",
    title: "What would you like to talk about?",
    placeholder: "e.g. switching careers",
    maxLength: profileEditSchema.shape.topics.maxLength ?? undefined,
  },
  linkedInUrl: {
    kind: "text",
    title: "What's your LinkedIn?",
    hint: "So your match can look you up before you meet.",
    placeholder: "linkedin.com/in/your-name",
  },
};

/**
 * Asks a member whose profile setup isn't done the profile questions, one per
 * screen, pre-filled with any saved answers. Finishing or exiting setup marks
 * profile setup done.
 */
export function ProfileWalkthrough({
  member,
  onDone,
}: {
  member: MemberProfile;
  onDone: () => void;
}) {
  const updateMutation = useUpdateMemberProfile(member.id);
  const titleId = useId();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<
    Partial<Record<WalkthroughField, string>>
  >(() =>
    Object.fromEntries(
      WALKTHROUGH_FIELDS.map((field) => [field, member[field] ?? ""]),
    ),
  );
  const [error, setError] = useState<string | undefined>();

  const field = WALKTHROUGH_FIELDS[step];
  const question = QUESTIONS[field];
  const answer = answers[field] ?? "";
  const isLast = step === WALKTHROUGH_FIELDS.length - 1;
  const isSaving = updateMutation.isPending;

  const setAnswer = (value: string) => {
    setAnswers((current) => ({ ...current, [field]: value }));
    setError(undefined);
  };

  const goTo = (nextStep: number) => {
    setError(undefined);
    updateMutation.reset();
    setStep(nextStep);
  };

  const advance = () => {
    if (!isLast) {
      goTo(step + 1);
      return;
    }
    notifications.show({
      color: "green",
      title: "You're all set",
      message: "You can change these answers on your profile anytime.",
    });
    onDone();
  };

  // The last question's save also marks profile setup done.
  const save = (value: string) =>
    updateMutation.mutate(
      isLast ? { [field]: value, profileSetupDone: true } : { [field]: value },
      { onSuccess: advance },
    );

  const submit = () => {
    const value =
      field === "linkedInUrl" ? normalizeLinkedInUrl(answer) : answer.trim();
    const result = profileEditSchema
      .pick({ [field]: true } as Record<WalkthroughField, true>)
      .safeParse({ [field]: value });
    if (!result.success) {
      setError(result.error.flatten().fieldErrors[field]?.[0]);
      return;
    }
    setAnswer(value);
    save(value);
  };

  // Members are greeted each time they arrive. The ref stops StrictMode's
  // double-run effects from greeting them twice.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    notifications.show({
      title: `Welcome to PatChats, ${member.firstName}!`,
      message:
        "A few quick questions help us find you a good match. They're all optional.",
    });
  }, [member.firstName]);

  // Marks profile setup done, so the walkthrough isn't shown again; the
  // questions can still be answered on the profile.
  const skipRest = () =>
    updateMutation.mutate(
      { profileSetupDone: true },
      {
        onSuccess: () => {
          notifications.show({
            title: "Welcome to PatChats!",
            message: "You can edit your profile anytime.",
          });
          onDone();
        },
      },
    );

  // Same modal look as the profile's deactivate/reactivate confirm.
  const confirmExitSetup = () =>
    modals.openConfirmModal({
      title: "Exit setup?",
      centered: true,
      radius: "md",
      padding: rem(24),
      styles: {
        title: { fontSize: "var(--mantine-font-size-lg)", fontWeight: 600 },
      },
      children: (
        <Text size="sm">
          You won&apos;t see these questions again, but you can answer them on
          your profile anytime.
        </Text>
      ),
      labels: { confirm: "Exit setup", cancel: "Keep going" },
      groupProps: { mt: rem(24) },
      cancelProps: { "data-autofocus": "true" },
      onConfirm: skipRest,
    });

  // Skip saves nothing, except that skipping the last question still marks
  // profile setup done.
  const skip = () => {
    if (!isLast) {
      advance();
      return;
    }
    updateMutation.mutate({ profileSetupDone: true }, { onSuccess: advance });
  };

  const answerId = `${titleId}-answer`;

  return (
    <Container size={560} py="xl">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text c="dimmed" size="sm">
            Question {step + 1} of {WALKTHROUGH_FIELDS.length}
          </Text>
          <QuietLink onClick={confirmExitSetup} disabled={isSaving}>
            Exit setup
          </QuietLink>
        </Group>
        <Progress
          value={((step + 1) / WALKTHROUGH_FIELDS.length) * 100}
          size="sm"
          aria-label="Profile questions progress"
        />
      </Stack>
      <form
        key={field}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Stack gap="xl" mt="xl">
          <Stack gap="xs">
            <Title order={2} size="h3" id={titleId}>
              {question.kind === "choice" ?
                question.title
              : <label htmlFor={answerId}>{question.title}</label>}
            </Title>
            {question.kind !== "choice" && question.hint && (
              <Text c="dimmed">{question.hint}</Text>
            )}
          </Stack>
          {question.kind === "choice" ?
            <SimpleGrid
              cols={{ base: 1, xs: question.columns }}
              spacing="md"
              verticalSpacing="lg"
              role="radiogroup"
              aria-labelledby={titleId}
            >
              {question.choices.map((choice) => (
                <Radio
                  key={choice.value}
                  name={field}
                  value={choice.value}
                  size="md"
                  label={choice.label}
                  description={choice.detail}
                  checked={answer === choice.value}
                  onChange={() => setAnswer(choice.value)}
                />
              ))}
            </SimpleGrid>
          : <TextInput
              id={answerId}
              size="md"
              value={answer}
              error={error}
              placeholder={question.placeholder}
              maxLength={question.maxLength}
              autoFocus
              onChange={(event) => setAnswer(event.target.value)}
            />
          }
          {updateMutation.isError && (
            <Alert color="red">
              Couldn&apos;t save your answer. Check your connection and try
              again.
            </Alert>
          )}
          <Group>
            {step > 0 && (
              <QuietLink onClick={() => goTo(step - 1)} disabled={isSaving}>
                Back
              </QuietLink>
            )}
            <Group gap="lg" ml="auto">
              <QuietLink onClick={skip} disabled={isSaving}>
                Skip
              </QuietLink>
              <Button
                type="submit"
                loading={isSaving && Boolean(answer.trim())}
                disabled={!answer.trim()}
              >
                {isLast ? "Finish" : "Continue"}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}

function QuietLink({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <Anchor
      component="button"
      type="button"
      c="dimmed"
      size="sm"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Anchor>
  );
}
