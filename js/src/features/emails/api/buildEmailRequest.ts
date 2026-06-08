import {
  EmailTemplate,
  TemplateAudience,
} from "@/features/emails/api/EmailTemplate";

export interface EmailSourceUser {
  anything?: string;
  email: string;
  industry?: string;
  intro?: string;
  linkedIn?: string;
  name: string;
  preferences?: string;
  topics?: string;
}

export interface EmailSourcePair {
  firstEmail: string;
  secondEmail: string;
}

export interface TemplateAudienceData {
  audience: TemplateAudience;
  pairs: EmailSourcePair[];
  users: EmailSourceUser[];
}

export interface EmailRecipient {
  email: string;
  variableToValue: Record<string, string>;
}

export interface EmailMessage {
  recipients: EmailRecipient[];
  variables?: Record<string, string>;
}

export interface SendEmailRequest {
  body: string;
  messages: EmailMessage[];
  replyTo: string | null;
  subject: string;
}

export interface SendEmailResponse {
  failed: number;
  results: Array<{
    error: string | null;
    recipients: string[];
    sent: boolean;
  }>;
  sent: number;
}

function withoutEmptyValues(values: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value?.trim()),
  ) as Record<string, string>;
}

function toRecipient(user: EmailSourceUser): EmailRecipient {
  return {
    email: user.email,
    variableToValue: withoutEmptyValues({
      anything: user.anything,
      email: user.email,
      industry: user.industry,
      intro: user.intro,
      linkedin: user.linkedIn,
      name: user.name,
      preferences: user.preferences,
      topics: user.topics,
    }),
  };
}

function createPairMessages(
  usersByEmail: Map<string, EmailSourceUser>,
  pairs: EmailSourcePair[],
): EmailMessage[] {
  return pairs.map((pair) => {
    const firstUser = usersByEmail.get(pair.firstEmail);
    const secondUser = usersByEmail.get(pair.secondEmail);

    if (!firstUser || !secondUser) {
      throw new Error(
        `Pairing references unknown email: ${pair.firstEmail} or ${pair.secondEmail}`,
      );
    }

    return { recipients: [toRecipient(firstUser), toRecipient(secondUser)] };
  });
}

export function buildEmailMessages(audienceData: TemplateAudienceData) {
  if (audienceData.audience === "all-users") {
    return audienceData.users.map((user) => ({
      recipients: [toRecipient(user)],
    }));
  }

  return createPairMessages(
    new Map(audienceData.users.map((user) => [user.email, user])),
    audienceData.pairs,
  );
}

export function buildEmailRequest(
  template: EmailTemplate,
  audienceData: TemplateAudienceData,
): SendEmailRequest {
  return {
    body: template.body,
    messages: buildEmailMessages(audienceData),
    replyTo: template.replyTo,
    subject: template.subject,
  };
}

export function countRecipients(messages: EmailMessage[]) {
  return messages.reduce(
    (recipientCount, message) => recipientCount + message.recipients.length,
    0,
  );
}

export function getMessageVariables(message: EmailMessage) {
  const variables = { ...message.variables };

  message.recipients.forEach((recipient, index) => {
    const prefix = `per${index + 1}.`;

    Object.entries(recipient.variableToValue).forEach(([key, value]) => {
      variables[`${prefix}${key}`] = value;
    });
  });

  return variables;
}

function findPlaceholderEnd(value: string, startIndex: number) {
  let depth = 1;

  for (let index = startIndex + 2; index < value.length; index += 1) {
    if (value[index] === "{") {
      depth += 1;
    }

    if (value[index] === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function findDefaultSeparator(value: string) {
  let depth = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "{") {
      depth += 1;
      continue;
    }

    if (value[index] === "}") {
      depth -= 1;
      continue;
    }

    if (value[index] === ":" && depth === 0) {
      return index;
    }
  }

  return -1;
}

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
) {
  let rendered = "";
  let cursor = 0;

  while (cursor < template.length) {
    const placeholderStart = template.indexOf("${", cursor);

    if (placeholderStart === -1) {
      return rendered + template.slice(cursor);
    }

    const placeholderEnd = findPlaceholderEnd(template, placeholderStart);

    if (placeholderEnd === -1) {
      return rendered + template.slice(cursor);
    }

    rendered += template.slice(cursor, placeholderStart);

    const placeholder = template.slice(placeholderStart, placeholderEnd + 1);
    const placeholderContent = template.slice(
      placeholderStart + 2,
      placeholderEnd,
    );
    const separatorIndex = findDefaultSeparator(placeholderContent);
    const key =
      separatorIndex === -1 ? placeholderContent : (
        placeholderContent.slice(0, separatorIndex)
      );
    const defaultValue =
      separatorIndex === -1 ? undefined : (
        placeholderContent.slice(separatorIndex + 1)
      );

    rendered +=
      variables[key] ??
      (defaultValue === undefined ? placeholder : (
        renderTemplate(defaultValue, variables)
      ));
    cursor = placeholderEnd + 1;
  }

  return rendered;
}
