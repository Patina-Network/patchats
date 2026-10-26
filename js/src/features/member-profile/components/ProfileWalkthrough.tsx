import { memberProfileSchema } from "@/features/member-profile/api/schemas";
import { useUpdateMemberProfile } from "@/features/member-profile/api/useUpdateMemberProfile";
import {
  Choice,
  INDUSTRY_CHOICES,
  MATCH_CHOICES,
} from "@/features/member-profile/components/profileFormConfig";
import { MemberProfile } from "@/features/member-profile/types";
import {
  normalizeLinkedInUrl,
  unaskedFields,
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
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
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
    maxLength: memberProfileSchema.shape.topics.maxLength ?? undefined,
  },
  linkedInUrl: {
    kind: "text",
    title: "What's your LinkedIn?",
    hint: "So your match can look you up before you meet.",
    placeholder: "linkedin.com/in/your-name",
  },
};

/**
 * Asks the profile questions a new member hasn't seen yet, one per screen.
 * NULL means "never asked" and Skip saves "", so skipped questions aren't
 * asked again.
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

  // Fixed on mount, so the list doesn't shrink as answers are saved.
  const [fields] = useState(() => unaskedFields(member));
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<
    Partial<Record<WalkthroughField, string>>
  >({});
  const [saved, setSaved] = useState<ReadonlySet<WalkthroughField>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | undefined>();

  const field = fields[step];
  const question = QUESTIONS[field];
  const answer = answers[field] ?? "";
  const isLast = step === fields.length - 1;
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

  const save = (value: string) =>
    updateMutation.mutate(
      { [field]: value },
      {
        onSuccess: () => {
          setSaved((current) => new Set(current).add(field));
          advance();
        },
      },
    );

  const submit = () => {
    const value =
      field === "linkedInUrl" ? normalizeLinkedInUrl(answer) : answer.trim();
    const result = memberProfileSchema
      .pick({ [field]: true } as Record<WalkthroughField, true>)
      .safeParse({ [field]: value });
    if (!result.success) {
      setError(result.error.flatten().fieldErrors[field]?.[0]);
      return;
    }
    setAnswer(value);
    save(value);
  };

  // Brand-new members (nothing answered yet) are greeted once on arrival. The
  // ref stops StrictMode's double-run effects from greeting them twice.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current || fields.length < WALKTHROUGH_FIELDS.length) return;
    greeted.current = true;
    notifications.show({
      title: `Welcome to PatChats, ${member.firstName}!`,
      message:
        "A few quick questions help us find you a good match. They're all optional.",
    });
  }, [fields.length, member.firstName]);

  // Marks every question not yet saved as skipped, so none is asked again;
  // they can still be filled in on the profile.
  const skipRest = () =>
    updateMutation.mutate(
      Object.fromEntries(
        fields
          .filter((unasked) => !saved.has(unasked))
          .map((unasked) => [unasked, ""]),
      ),
      {
        onSuccess: () => {
          notifications.show({
            title: "No problem",
            message: "You can add these on your profile anytime.",
          });
          onDone();
        },
      },
    );

  // Skipping an answer saved earlier (reached with Back) keeps it.
  const skip = () => {
    if (saved.has(field)) {
      advance();
      return;
    }
    save("");
  };

  const answerId = `${titleId}-answer`;

  return (
    <Container size={560} py="xl">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text c="dimmed" size="sm">
            Question {step + 1} of {fields.length}
          </Text>
          <QuietLink onClick={skipRest} disabled={isSaving}>
            Skip for now
          </QuietLink>
        </Group>
        <Progress
          value={((step + 1) / fields.length) * 100}
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
                  disabled={isSaving}
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
              <Button type="submit" loading={isSaving}>
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
