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

// Async email flow with template ID (replaces SendRequest for new code)
export interface SendAsyncRequest {
  templateId: string;
  replyTo?: string | null;
  messages: {
    recipients: {
      email: string;
      variableToValue: Record<string, string>;
    }[];
  }[];
}

// Async email flow types

export interface EnqueueEmailRequest {
  templateId: string;
  replyTo?: string | null;
  messages: {
    recipients: {
      email: string;
      variableToValue: Record<string, string>;
    }[];
  }[];
}

export interface EnqueueEmailResponse {
  requestId: string;
  accepted: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailProgress {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  error: number;
  emails: EmailRow[];
}

export interface EmailRow {
  id: string;
  recipients: string[];
  status: "PENDING" | "PROCESSING" | "SENT" | "ERROR";
  error: string | null;
  sentAt: string | null;
}

export interface EmailRequestSummary {
  id: string;
  source: "MANUAL" | "MATCHING";
  templateId: string | null;
  createdAt: string;
  total: number;
  sent: number;
  error: number;
  inFlight: number;
  terminal: boolean;
}
