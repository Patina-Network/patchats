import { memberProfileSchema } from "@/features/member-profile/api/schemas";
import { MemberProfileValues } from "@/features/member-profile/types";
import {
  INDUSTRIES,
  MATCH_PREFS,
} from "@/features/sign-up/components/signUpFormConfig";
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
const matchPrefOptions = MATCH_PREFS.map((v) => ({
  value: v,
  label: v,
}));
const industryPrefOptions = INDUSTRIES.map((v) => ({ value: v, label: v }));

// Define initial values
const initialFormValues: MemberProfileValues = {
  firstName: "",
  lastName: "",
  email: "",
  linkedInUrl: "",
  introduction: "",
  referralSource: "",
  matchPref: "",
  industryPref: "",
  rolePref: "",
  topics: "",
  extraNotes: "",
};

export function SignUpForm() {
  // State management
  const [values, setValues] = useState<MemberProfileValues>(() => ({
    ...initialFormValues,
  }));

  const [errors, setErrors] = useState<
    Partial<Record<keyof MemberProfileValues, string>>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper function
  const normalizeLinkedInUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("linkedin.com/in/") && !trimmed.startsWith("http")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  // Handlers
  const handleFieldChange = <K extends keyof MemberProfileValues>(
    field: K,
    value: MemberProfileValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage(null);
    setSubmitError(null);
  };

  const handleFieldBlur = (
    field: keyof MemberProfileValues,
    overrideValue?: string,
  ) => {
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
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        setSuccessMessage("Your form was submitted successfully.");
        setValues({ ...initialFormValues });
      } else {
        const data = await response.json();
        setSubmitError(
          data.message ||
            "An error occurred while submitting the form. Please try again later or contact an administrator.",
        );
      }
    } catch (_error) {
      setSubmitError(
        "Network error - please check your connection and try again",
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
            label="First Name"
            value={values.firstName}
            onChange={(event) =>
              handleFieldChange("firstName", event.target.value)
            }
            onBlur={() => handleFieldBlur("firstName")}
            error={errors.firstName}
            autoFocus
          />
          <TextInput
            required
            label="Last Name"
            value={values.lastName}
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
            onChange={(event) => handleFieldChange("email", event.target.value)}
            onBlur={() => handleFieldBlur("email")}
            error={errors.email}
          />
          <TextInput
            label="LinkedIn"
            description="Use the format linkedin.com/in/your-profile"
            value={values.linkedInUrl}
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
            data={matchPrefOptions}
            value={values.matchPref}
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
            onChange={(event) =>
              handleFieldChange("extraNotes", event.target.value)
            }
            onBlur={() => handleFieldBlur("extraNotes")}
            error={errors.extraNotes}
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
