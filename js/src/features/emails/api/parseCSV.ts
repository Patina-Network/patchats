import type { User, Pair, SendRequest } from "@/features/emails/dto/emailDto";

import { emailTemplateMap } from "@/features/emails/api/emailTemplate";
import { parse, ParseResult } from "papaparse";

export const readFiles = async (
  userFile: File,
  pairingFile: File | null,
  template: string,
): Promise<SendRequest> => {
  const request = combineData(userFile, pairingFile, template);
  return request;
};

async function combineData(
  userFile: File,
  pairFile: File | null,
  templateKey: string,
): Promise<SendRequest> {
  const userMap = await parseUserFile(userFile);

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
  if (pairFile) {
    // One message per pair, addressed to two recipients. The pairing file only gives us names + emails,
    // so we look each person up in userMap to add the user with their full set of variables.
    const pairList = await parsePairingFile(pairFile);
    messages = pairList.map((p) => {
      const userA = userMap.get(p.emailA);
      const userB = userMap.get(p.emailB);
      if (!userA) {
        throw new Error(`Pairing references unknown email: ${p.emailA}`);
      }
      if (!userB) {
        throw new Error(`Pairing references unknown email: ${p.emailB}`);
      }
      //Combines two users into a recipient list within a message object
      return { recipients: [toRecipient(userA), toRecipient(userB)] };
    });
  } else {
    // No pairing file: one message per user.
    messages = Array.from(userMap.values()).map((u) => ({
      recipients: [toRecipient(u)],
    }));
  }

  const template = emailTemplateMap[templateKey];

  const sendRequest = {
    subject: template.subject,
    body: template.body,
    replyTo: template.replyTo,
    messages,
  };

  return sendRequest;
}

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

  //check User CSV for required headers
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
      email: userData.email,
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
export async function parsePairingFile(pairFile: File): Promise<Pair[]> {
  const config = {
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ",",
    header: false, //change header to false
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
      emailA: pairData[1],
      fullNameB: pairData[2],
      emailB: pairData[3],
    };
    pairings.push(pair);
  }

  return pairings;
}
