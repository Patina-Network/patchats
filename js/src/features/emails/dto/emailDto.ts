export interface User {
  firstName: string;
  lastName: string;
  email: string;
  intro: string;
  linkedIn: string;
  industry: string;
  preferences: string;
  topics: string;
  anything: string;
}

export interface Pair {
  firstNameA: string;
  lastNameA: string;
  emailA: string;
  firstNameB: string;
  lastNameB: string;
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
