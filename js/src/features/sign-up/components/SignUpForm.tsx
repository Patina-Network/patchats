import { userProfileSchema } from "@/features/api/schemas";
import {
  INDUSTRIES,
  MATCHING_PREFERENCES,
} from "@/features/sign-up/components/signUpFormConfig";
import { UserProfileValues } from "@/features/types";
import {
  Alert,
  Button,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";

// Options for select fields. Defined in SignUpFormConfig
const matchingPreferenceOptions = MATCHING_PREFERENCES.map((v) => ({
  value: v,
  label: v,
}));
const industryOptions = INDUSTRIES.map((v) => ({ value: v, label: v }));

// Define initial values
const initialFormValues: UserProfileValues = {
  fullName: "",
  email: "",
  linkedin: "",
  introduction: "",
  referralSource: "",
  matchingPreference: "",
  industry: "",
  role: "",
  talkingPoints: "",
  additionalInfo: "",
};

export function SignUpForm() {
  // State management
  const [values, setValues] = useState<UserProfileValues>(() => ({
    ...initialFormValues,
  }));

  const [errors, setErrors] = useState<
    Partial<Record<keyof UserProfileValues, string>>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper function
  const normalizeLinkedin = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("linkedin.com/in/") && !trimmed.startsWith("http")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  // Handlers
  const handleFieldChange = <K extends keyof UserProfileValues>(
    field: K,
    value: UserProfileValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage(null);
    setSubmitError(null);
  };

  const handleFieldBlur = (
    field: keyof UserProfileValues,
    overrideValue?: string,
  ) => {
    const valueToValidate = overrideValue ?? values[field];
    const fieldSchema = userProfileSchema.pick({ [field]: true } as Record<
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
  const validateForm = (values: UserProfileValues) => {
    const result = userProfileSchema.safeParse(values);
    const fieldErrors =
      result.success ? {} : result.error?.flatten().fieldErrors;
    const errors = {} as Partial<Record<keyof UserProfileValues, string>>;
    for (const key in fieldErrors) {
      if (fieldErrors[key as keyof UserProfileValues]?.[0]) {
        errors[key as keyof UserProfileValues] =
          fieldErrors[key as keyof UserProfileValues]?.[0];
      }
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setSubmitError(null);

    const validationErrors = validateForm(values);
    // console.log("errors:", validationErrors);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError("Please fix the errors above before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: replace with API call
      await Promise.resolve();
      setSuccessMessage("Your form was submitted successfully.");
    } catch (_error) {
      setSubmitError(
        "There was a problem submitting the form. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper withBorder p="xl" radius="md">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="lg">
          <Title order={3}>Contact</Title>
          <TextInput
            required
            label="Full Name"
            value={values.fullName}
            onChange={(event) =>
              handleFieldChange("fullName", event.target.value)
            }
            onBlur={() => handleFieldBlur("fullName")}
            error={errors.fullName}
            autoFocus
          />
          <TextInput
            required
            type="email"
            label="Email Address"
            description="Use an email address you check regularly, as this is how we will contact you about your matches!"
            value={values.email}
            onChange={(event) => handleFieldChange("email", event.target.value)}
            onBlur={() => handleFieldBlur("email")}
            error={errors.email}
          />
          <TextInput
            label="LinkedIn"
            description="Use the format linkedin.com/in/your-profile"
            value={values.linkedin}
            onChange={(event) =>
              handleFieldChange("linkedin", event.target.value)
            }
            onBlur={() => {
              const normalized = normalizeLinkedin(values.linkedin);
              handleFieldChange("linkedin", normalized);
              handleFieldBlur("linkedin", normalized);
            }}
            error={errors.linkedin}
          />
          <Divider />
          <Title order={3}>Introduction</Title>
          <Textarea
            required
            label="Introduce yourself to your PatChats match in 1-2 sentences, written in third person"
            description="e.g. Jane is a marketing manager with 5 years of experience in the tech industry. She is passionate about mentorship and is looking for opportunities to connect with students."
            value={values.introduction}
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
            data={matchingPreferenceOptions}
            value={values.matchingPreference}
            onChange={(value) =>
              handleFieldChange(
                "matchingPreference",
                (value || "") as UserProfileValues["matchingPreference"],
              )
            }
            onBlur={() => handleFieldBlur("matchingPreference")}
            error={errors.matchingPreference}
          />
          <Select
            label="What industry are you in, or looking to get into?"
            placeholder="No Preference"
            data={industryOptions}
            value={values.industry}
            onChange={(value) =>
              handleFieldChange(
                "industry",
                (value || "") as UserProfileValues["industry"],
              )
            }
            onBlur={() => handleFieldBlur("industry")}
            error={errors.industry}
          />
          <TextInput
            label="What role(s) would you like to get matched with?"
            placeholder="Optional"
            value={values.role}
            onChange={(event) => handleFieldChange("role", event.target.value)}
            onBlur={() => handleFieldBlur("role")}
            error={errors.role}
          />
          <TextInput
            label="What are some things you would like to talk about?"
            placeholder="Optional"
            value={values.talkingPoints}
            onChange={(event) =>
              handleFieldChange("talkingPoints", event.target.value)
            }
            onBlur={() => handleFieldBlur("talkingPoints")}
            error={errors.talkingPoints}
          />
          <Textarea
            label="Anything else you would like us to consider when matching you?"
            placeholder="Optional"
            value={values.additionalInfo}
            onChange={(event) =>
              handleFieldChange("additionalInfo", event.target.value)
            }
            onBlur={() => handleFieldBlur("additionalInfo")}
            error={errors.additionalInfo}
            minRows={3}
          />
          {submitError && <Alert color="red">{submitError}</Alert>}
          {successMessage && <Alert color="green">{successMessage}</Alert>}
          <Group align="right" mt="md">
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Submit Form
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
