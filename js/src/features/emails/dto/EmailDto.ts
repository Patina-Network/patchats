export interface User {
  Name: string;
  Email: string;
  Intro: string;
  LinkedIn: string;
  Industry: string;
  Preferences: string;
  Topics: string;
  Anything: string;
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
