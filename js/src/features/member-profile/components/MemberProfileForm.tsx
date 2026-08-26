import { memberProfileSchema } from "@/features/member-profile/api/schemas";
import { useMemberProfile } from "@/features/member-profile/api/useMemberProfile";
import { useUpdateMemberProfile } from "@/features/member-profile/api/useUpdateMemberProfile";
import {
  MemberProfileValues,
  toFormValues,
} from "@/features/member-profile/types";
import {
  INDUSTRIES,
  MATCH_PREFS,
} from "@/features/sign-up/components/signUpFormConfig";
import {
  Alert,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";

// Options for select fields. Defined in SignUpFormConfig
const matchPrefOptions = MATCH_PREFS.map((v) => ({
  value: v,
  label: v,
}));
const industryPrefOptions = INDUSTRIES.map((v) => ({ value: v, label: v }));

export function MemberProfileForm({ id }: { id: string }) {
  const { data: member, isLoading, isError } = useMemberProfile(id);
  const updateMutation = useUpdateMemberProfile(id);

  // State management
  const [values, setValues] = useState<MemberProfileValues | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof MemberProfileValues, string>>
  >({});
  const [isEditing, setIsEditing] = useState(false);

  // Keep the draft in sync whenever the fetched member changes (e.g. on first load)

  useEffect(() => {
    if (member && !isEditing) setValues(toFormValues(member));
  }, [member, isEditing]);


  // Helper function
  const normalizeLinkedInUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("linkedin.com/in/") && !trimmed.startsWith("http")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  if (isLoading) return <Loader />;
  if (isError || !member)
    return <Alert color="red">Failed to load profile.</Alert>;
  if (!values) return <Loader />;

  // Handlers
  const handleFieldChange = <K extends keyof MemberProfileValues>(
    field: K,
    value: MemberProfileValues[K],
  ) => {
    if (!isEditing) return;
    setValues({ ...values, [field]: value });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleFieldBlur = (
    field: keyof MemberProfileValues,
    overrideValue?: string,
  ) => {
    if (!isEditing) return;
    const valueToValidate = overrideValue ?? values[field];
    const fieldSchema = memberProfileSchema.pick({ [field]: true } as Record<
      typeof field,
      true
    >);
    const result = fieldSchema.safeParse({ [field]: valueToValidate });
    if (!result.success) {
      const message = result.error.flatten().fieldErrors[field]?.[0];
      if (message) setErrors((current) => ({ ...current, [field]: message }));
    }
  };

  // Validation logic
  const validateForm = (values: MemberProfileValues) => {
    const result = memberProfileSchema.safeParse(values);
    const fieldErrors =
      result.success ? {} : result.error?.flatten().fieldErrors;
    const errors = {} as Partial<Record<keyof MemberProfileValues, string>>;
    for (const key in fieldErrors) {
      if (fieldErrors[key as keyof MemberProfileValues]?.[0]) {
        errors[key as keyof MemberProfileValues] =
          fieldErrors[key as keyof MemberProfileValues]?.[0];
      }
    }
    return errors;
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setValues(toFormValues(member));
    setErrors({});
    setIsEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await updateMutation.mutateAsync(values);
      setIsEditing(false);
    } catch {
      // updateMutation.isError drives the error Alert below
    }
  };

  return (
    <Paper withBorder p="xl" radius="md">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="lg">
          <Title order={3}>Contact</Title>
          <TextInput
            required
            label="First Name"
            value={values.firstName}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("firstName", event.target.value)
            }
            onBlur={() => handleFieldBlur("firstName")}
            error={errors.firstName}
          />
          <TextInput
            required
            label="Last Name"
            value={values.lastName}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("lastName", event.target.value)
            }
            onBlur={() => handleFieldBlur("lastName")}
            error={errors.lastName}
          />
          <TextInput
            required
            type="email"
            label="Email Address"
            description="Use an email address you check regularly, as this is how we will contact you about your matches!"
            value={values.email}
            disabled={!isEditing}
            onChange={(event) => handleFieldChange("email", event.target.value)}
            onBlur={() => handleFieldBlur("email")}
            error={errors.email}
          />
          <TextInput
            label="LinkedIn"
            description="Use the format linkedin.com/in/your-profile"
            value={values.linkedInUrl}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("linkedInUrl", event.target.value)
            }
            onBlur={() => {
              const normalized = normalizeLinkedInUrl(values.linkedInUrl);
              handleFieldChange("linkedInUrl", normalized);
              handleFieldBlur("linkedInUrl", normalized);
            }}
            error={errors.linkedInUrl}
          />
          <Divider />
          <Title order={3}>Introduction</Title>
          <Textarea
            required
            label="Introduce yourself to your PatChats match in 1-2 sentences, written in third person"
            description="e.g. Jane is a marketing manager with 5 years of experience in the tech industry. She is passionate about mentorship and is looking for opportunities to connect with students."
            value={values.introduction}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("introduction", event.target.value)
            }
            onBlur={() => handleFieldBlur("introduction")}
            error={errors.introduction}
            minRows={4}
          />
          <TextInput
            label="How did you find out about us?"
            description="If you were referred by a friend, please include their name!"
            value={values.referralSource}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("referralSource", event.target.value)
            }
            onBlur={() => handleFieldBlur("referralSource")}
            error={errors.referralSource}
          />
          <Divider />
          <Title order={3}>Matching</Title>
          <Text size="sm" c="dimmed">
            We will do our best to accommodate your preferences.
          </Text>
          <Select
            label="Matching Preference"
            placeholder="No Preference"
            data={matchPrefOptions}
            value={values.matchPref}
            disabled={!isEditing}
            onChange={(value) =>
              handleFieldChange(
                "matchPref",
                (value || "") as MemberProfileValues["matchPref"],
              )
            }
            onBlur={() => handleFieldBlur("matchPref")}
            error={errors.matchPref}
          />
          <Select
            label="What industry are you in, or looking to get into?"
            placeholder="No Preference"
            data={industryPrefOptions}
            value={values.industryPref}
            disabled={!isEditing}
            onChange={(value) =>
              handleFieldChange(
                "industryPref",
                (value || "") as MemberProfileValues["industryPref"],
              )
            }
            onBlur={() => handleFieldBlur("industryPref")}
            error={errors.industryPref}
          />
          <TextInput
            label="What role(s) would you like to get matched with?"
            placeholder="Optional"
            value={values.rolePref}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("rolePref", event.target.value)
            }
            onBlur={() => handleFieldBlur("rolePref")}
            error={errors.rolePref}
          />
          <TextInput
            label="What are some things you would like to talk about?"
            placeholder="Optional"
            value={values.topics}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("topics", event.target.value)
            }
            onBlur={() => handleFieldBlur("topics")}
            error={errors.topics}
          />
          <Textarea
            label="Anything else you would like us to consider when matching you?"
            placeholder="Optional"
            value={values.extraNotes}
            disabled={!isEditing}
            onChange={(event) =>
              handleFieldChange("extraNotes", event.target.value)
            }
            onBlur={() => handleFieldBlur("extraNotes")}
            error={errors.extraNotes}
            minRows={3}
          />
          {updateMutation.isError && (
            <Alert color="red">
              Failed to update profile. Please try again.
            </Alert>
          )}
          <Group justify="flex-end" mt="md">
            {isEditing ?
              <>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={updateMutation.isPending}>
                  Save
                </Button>
              </>
            : <Button type="button" onClick={handleEditClick}>
                Edit
              </Button>
            }
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
