import type { User, Pair, SendRequest } from "@/features/emails/dto/emailDto";

import { emailTemplateMap } from "@/features/emails/api/emailTemplate";
import { parse, ParseResult } from "papaparse";

/**
 * Takes parsed user/pair data and generates a SendRequest object based on the selected email template.
 * @param userMap - map of user data keyed by email address
 * @param pairList - list of user pairs
 * @param template - the selected email template
 * @returns SendRequest object to be sent to backend email API
 */
export const dataToSendRequest = async (
  userMap: Map<string, User>,
  pairList: Pair[],
  template: string,
): Promise<SendRequest> => {
  // Drop empty/whitespace-only values so the key is absent from variableToValue. The backend
  // resolves missing keys (not empty strings) to a template default via ${x:default}
  const withoutEmpty = (vars: Record<string, string>): Record<string, string> =>
    Object.fromEntries(
      Object.entries(vars).filter(([, value]) => value?.trim()),
    );

  // Turn a full User record into a recipient oject with their variables.
  const toRecipient = (u: User) => ({
    email: u.email,
    variableToValue: withoutEmpty({
      name: u.name,
      email: u.email,
      intro: u.intro,
      linkedIn: u.linkedIn,
      industry: u.industry,
      preferences: u.preferences,
      topics: u.topics,
      anything: u.anything,
      firstName: (u.name ?? "").split(" ")[0],
      lastName: (u.name ?? "").split(" ").slice(1).join(" "),
    }),
  });

  let messages;
  if (pairList.length > 0) {
    // One message per pair, addressed to two recipients. The pairing file only gives us names + emails,
    // so we look each person up in userMap to add the user with their full set of variables.
    messages = pairList.map((p) => {
      const userA = userMap.get(p.emailA);
      const userB = userMap.get(p.emailB);
      if (!userA) {
        throw new Error(`Pairing references unknown email: ${p.emailA}`);
      }
      if (!userB) {
        throw new Error(`Pairing references unknown email: ${p.emailB}`);
      }
      // Combines two users into a recipient list within a message object
      return { recipients: [toRecipient(userA), toRecipient(userB)] };
    });
  } else {
    // No pairing file: one message per user.
    messages = Array.from(userMap.values()).map((u) => ({
      recipients: [toRecipient(u)],
    }));
  }

  const templateValue = emailTemplateMap[template];

  const sendRequest = {
    subject: templateValue.subject,
    body: templateValue.body,
    replyTo: templateValue.replyTo,
    messages,
  };

  return sendRequest;
};

/**
 * Parses the user CSV file and returns a map of user data.
 * @param userFile - The user CSV file to be parsed.
 * @returns user data map
 */
export async function parseUserFile(
  userFile: File,
): Promise<Map<string, User>> {
  const text = await userFile.text();
  const config = {
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ",",
    header: true,
    skipEmptyLines: true,
    columns: null,
  };
  const userMap = new Map<string, User>();
  const results = parse<User>(text, config);

  // Check User CSV for required headers
  const headers = results.meta.fields ?? [];
  const requiredHeaders = [
    "name",
    "email",
    "intro",
    "linkedIn",
    "industry",
    "preferences",
    "topics",
    "anything",
  ];
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );
  if (missingHeaders.length > 0) {
    throw new Error(
      `User file is missing required headers: ${missingHeaders.join(", ")}`,
    );
  }

  for (const userData of results.data) {
    const user: User = {
      name: userData.name,
      // Trim so trailing whitespace from the CSV doesn't fail backend email validation.
      email: userData.email?.trim(),
      intro: userData.intro,
      linkedIn: userData.linkedIn,
      industry: userData.industry,
      preferences: userData.preferences,
      topics: userData.topics,
      anything: userData.anything,
    };
    userMap.set(user.email, user);
  }
  return userMap;
}

/**
 * Parses the pairing CSV file and returns a list of pair data.
 * @param pairFile - The pairing CSV file to be parsed.
 * @returns pair data list
 */
export async function parsePairingFile(pairFile: File): Promise<Pair[]> {
  const config = {
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ",",
    header: false, // Change header to false
    skipEmptyLines: true,
    columns: null,
    complete: (results: ParseResult<string[]>) => {
      console.log("Parsed pairings data:", results.data);
    },
  };
  const text = await pairFile.text();
  const results = parse(text, config);
  const pairings = [];
  for (const pairData of results.data) {
    const pair: Pair = {
      fullNameA: pairData[0],
      // Trim so emails match the trimmed userMap keys and pass backend validation.
      emailA: pairData[1]?.trim(),
      fullNameB: pairData[2],
      emailB: pairData[3]?.trim(),
    };
    pairings.push(pair);
  }

  return pairings;
}
