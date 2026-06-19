import { signUpFormSchema } from "@/features/sign-up/api/schemas";
import {
  INDUSTRIES,
  MATCHING_PREFERENCES,
  TALKING_POINTS,
} from "@/features/sign-up/components/signUpFormConfig";
import { SignUpFormValues } from "@/features/sign-up/types";
import {
  Alert,
  Button,
  Divider,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
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

const talkingPointOptions = TALKING_POINTS.map((v) => ({ value: v, label: v }));

const industryOptions = INDUSTRIES.map(({ name }) => ({
  value: name,
  label: name,
}));

const roleOptionsByIndustry: Record<
  string,
  { value: string; label: string }[]
> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.name, i.roles.map((r) => ({ value: r, label: r }))]),
);

// Define initial values
const initialFormValues: SignUpFormValues = {
  fullName: "",
  email: "",
  linkedin: "",
  introduction: "",
  referralSource: "",
  matchingPreference: "",
  industry: "",
  role: "",
  talkingPoints: [],
  additionalInfo: "",
};

export function SignUpForm() {
  // State management
  const [values, setValues] = useState<SignUpFormValues>(() => ({
    ...initialFormValues,
  }));

  const [errors, setErrors] = useState<
    Partial<Record<keyof SignUpFormValues, string>>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const availableRoleOptions =
    values.industry ? roleOptionsByIndustry[values.industry] : [];

  // Handlers
  const handleFieldChange = <K extends keyof SignUpFormValues>(
    field: K,
    value: SignUpFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage(null);
    setSubmitError(null);
  };

  const handleIndustryChange = (value: string | null) => {
    setValues((current) => {
      const nextIndustry = value ?? "";
      const nextRoleOptions =
        values.industry ? roleOptionsByIndustry[values.industry] : [];
      const roleIsValid = nextRoleOptions.some(
        (option) => option.value === current.role,
      );
      return {
        ...current,
        industry: nextIndustry,
        role: roleIsValid ? current.role : "",
      };
    });
    setErrors((current) => ({
      ...current,
      industry: undefined,
      role: undefined,
    }));
    setSuccessMessage(null);
    setSubmitError(null);
  };

  // Validation logic
  const validateForm = (values: SignUpFormValues) => {
    const result = signUpFormSchema.safeParse(values);
    const fieldErrors =
      result.success ? {} : result.error?.flatten().fieldErrors;
    const errors = {} as Partial<Record<keyof SignUpFormValues, string>>;
    for (const key in fieldErrors) {
      if (fieldErrors[key as keyof SignUpFormValues]?.[0]) {
        errors[key as keyof SignUpFormValues] =
          fieldErrors[key as keyof SignUpFormValues]?.[0];
      }
    }
    if (
      values.role &&
      values.industry &&
      !availableRoleOptions.some((option) => option.value === values.role)
    ) {
      errors.role = "Select a role that matches the chosen industry.";
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setSubmitError(null);

    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
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
            placeholder="Enter your full name"
            value={values.fullName}
            onChange={(event) =>
              handleFieldChange("fullName", event.currentTarget.value)
            }
            error={errors.fullName}
            autoFocus
          />
          <TextInput
            required
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            value={values.email}
            onChange={(event) =>
              handleFieldChange("email", event.currentTarget.value)
            }
            error={errors.email}
          />
          <TextInput
            label="LinkedIn"
            placeholder="https://linkedin.com/in/your-profile"
            value={values.linkedin}
            onChange={(event) =>
              handleFieldChange("linkedin", event.currentTarget.value)
            }
            error={errors.linkedin}
          />
          <Divider />
          <Title order={3}>Introduction</Title>
          <Textarea
            required
            label="Introduce yourself to your PatChats match in 1-2 sentences."
            placeholder="Tell us a little about yourself."
            value={values.introduction}
            onChange={(event) =>
              handleFieldChange("introduction", event.currentTarget.value)
            }
            error={errors.introduction}
            minRows={4}
          />
          <TextInput
            label="How did you find out about us?"
            value={values.referralSource}
            onChange={(event) =>
              handleFieldChange("referralSource", event.currentTarget.value)
            }
            error={errors.referralSource}
          />
          <Divider />
          <Title order={3}>Matching</Title>
          <Select
            required
            label="Matching Preference"
            placeholder="Choose one"
            data={matchingPreferenceOptions}
            value={values.matchingPreference}
            onChange={(value) =>
              handleFieldChange(
                "matchingPreference",
                (value || "") as SignUpFormValues["matchingPreference"],
              )
            }
            error={errors.matchingPreference}
          />
          <Select
            label="What industry are you interested in?"
            placeholder="Choose one"
            data={industryOptions}
            value={values.industry}
            onChange={handleIndustryChange}
            error={errors.industry}
          />
          <Select
            label="What role are you interested in?"
            placeholder={
              availableRoleOptions.length > 0 ?
                "Choose one"
              : "Select an industry first"
            }
            data={availableRoleOptions}
            value={values.role}
            onChange={(value) => handleFieldChange("role", value ?? "")}
            error={errors.role}
            disabled={availableRoleOptions.length === 0}
            clearable
          />
          <MultiSelect
            label="What are some things you would like to talk about?"
            placeholder="Select topics"
            data={talkingPointOptions}
            value={values.talkingPoints}
            onChange={(value) => handleFieldChange("talkingPoints", value)}
          />
          <Textarea
            label="Anything else you would like us to know?"
            value={values.additionalInfo}
            onChange={(event) =>
              handleFieldChange("additionalInfo", event.currentTarget.value)
            }
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
