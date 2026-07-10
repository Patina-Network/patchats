export interface User {
  name: string;
  email: string;
  intro: string;
  linkedIn: string;
  industry: string;
  preferences: string;
  topics: string;
  anything: string;
  firstName?: string;
  lastName?: string;
}

export interface Pair {
  fullNameA: string;
  emailA: string;
  fullNameB: string;
  emailB: string;
}

export interface MessagePreview {
  recipients: string[];
  subject: string | null;
  body: string | null;
  error: string | null;
}

export interface SendRequest {
  subject: string;
  body: string;
  replyTo: string | null;
  messages: {
    recipients: {
      email: string;
      variableToValue: Record<string, string>;
    }[];
  }[];
}
