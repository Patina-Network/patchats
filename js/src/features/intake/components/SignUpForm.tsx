import {
  INDUSTRIES,
  MATCHING_PREFERENCES,
  TALKING_POINTS,
} from "@/features/intake/components/SignUpFormConfig";
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
import { z } from "zod";

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

// Email and LinkedIn URL validation using zod schemas
const emailSchema = z.string().email();
const linkedinSchema = z
  .string()
  .url()
  .startsWith("https://linkedin.com/")
  .or(z.string().url().startsWith("https://www.linkedin.com/"));

const isValidEmail = (email: string) =>
  emailSchema.safeParse(email.trim()).success;
const isValidLinkedinUrl = (value: string) =>
  linkedinSchema.safeParse(value.trim()).success;

// Define props and initial values for the signupForm component
export interface SignUpFormValues {
  fullName: string;
  email: string;
  linkedin: string;
  introduction: string;
  referralSource: string;
  matchingPreference: string;
  industry: string;
  role: string;
  talkingPoints: string[];
  additionalInfo: string;
}

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

  const validate = () => {
    const nextErrors: Partial<Record<keyof SignUpFormValues, string>> = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Full Name is required.";
    } else if (values.fullName.trim().length < 2) {
      nextErrors.fullName = "Full Name must be at least 2 characters.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Email Address is required.";
    } else if (!isValidEmail(values.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (values.linkedin.trim() && !isValidLinkedinUrl(values.linkedin)) {
      nextErrors.linkedin =
        "Enter a valid LinkedIn URL starting with https://linkedin.com/.";
    }

    if (!values.introduction) {
      nextErrors.introduction = "Introduction is required.";
    }

    if (values.introduction.trim().length > 300) {
      nextErrors.introduction = "Introduction must be 300 characters or fewer.";
    }

    if (!values.matchingPreference) {
      nextErrors.matchingPreference = "Matching Preference is required.";
    }

    if (!values.industry) {
      nextErrors.industry = "Industry is required.";
    }

    if (
      values.role &&
      values.industry &&
      !availableRoleOptions.some((option) => option.value === values.role)
    ) {
      nextErrors.role = "Select a role that matches the chosen industry.";
    }

    if (values.referralSource.trim().length > 200) {
      nextErrors.referralSource = "Answer must be 200 characters or fewer.";
    }

    if (values.additionalInfo.trim().length > 500) {
      nextErrors.additionalInfo = "Answer must be 500 characters or fewer.";
    }

    console.log("Validation errors", nextErrors);

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setSubmitError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: replace with API call
      await Promise.resolve();
      setSuccessMessage("Your form was submitted successfully.");
      setErrors({});
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
            required
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
