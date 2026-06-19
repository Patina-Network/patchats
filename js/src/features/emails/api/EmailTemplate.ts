/**
 * Email templates shared with the backend email API.
 *
 * Placeholder semantics (see EmailTemplates.md):
 *   ${x}         required — throws error
 *   ${x:default} falls back to `default` 
 *   ${x:}        blanks out 

 * Message-level variables are referenced un-prefixed (e.g. ${pair}); per-recipient
 * variables are referenced positionally as ${per.x} / ${per.x}.
 * 
 * Note: Users are refered to as per1.name even if the email is only sent to one 
 * user. Also, attributes such as 'intro' is reference without the perN prefix in 
 * emails sent to individual users, but would be referenced with the perN prefix 
 * if included in a message sent to multiple users. 
 */

//Defaults
const INTRO_MISSING = "{Intro missing! Send me an intro to add to the emails.}";
const month: string = new Intl.DateTimeFormat("en-US", {
  month: "long",
}).format(new Date());

export interface EmailTemplate {
  /** Human-readable name shown in the admin UI. */
  name: string;
  /** Subject-line template. */
  subject: string;
  /** Body template. */
  body: string;
  /** Default reply-to address, or null to use the sender default. */
  replyTo: string | null;
}

/**
 * Builds an {@link EmailTemplate} from preconfigured strings.
 * @param name     Human-readable name shown in the admin UI.
 * @param subject  Subject-line template.
 * @param body     Body template.
 * @param replyTo  Default reply-to address, or null to use the sender default.
 */
export function emailTemplate(
  name: string,
  subject: string,
  body: string,
  replyTo: string | null = null,
): EmailTemplate {
  return { name, subject, body, replyTo };
}

/** Sample template for testing purposes and reference*/
export const SAMPLE_TEMPLATE: EmailTemplate = emailTemplate(
  "Sample",
  "You're paired!",
  `Hi \${per1.name} and \${per2.name}.\n\nYou're paired with \${per1.name} & \${per2.name}.`,
  "coordinator@patinanetwork.org",
);

/** Sent to a pair of users every month when a match is made. */
export const PAIR_TEMPLATE: EmailTemplate = emailTemplate(
  "Pair",
  "[PatChats " +
    month +
    "] ${per1.name} and ${per2.name}, you've been paired for PatChats!",
  `Hey \${per1.name} and \${per2.name}! \n
We've paired you two for PatChats this month! Find some time to have a 30 minute coffee chat or video call with your pairing!
Share a screenshot or selfie of you two in the #pat-chats channel on the Discord server! \n
\${per1.name} (\${per1.email}): 
\${per1.intro: ${INTRO_MISSING}} 
\${per1.linkedin:}\n
\${per2.name} (\${per2.email}): 
\${per2.intro: ${INTRO_MISSING}}
\${per2.linkedin:}\n
Let me know if you'd like to update your pairing information or want to be taken off the list.\n 
Cheers,
Patina Network`,
);

export const REMINDER_TEMPLATE: EmailTemplate = emailTemplate(
  "Reminder",
  `[PatChats ` + month + `] Reminder: Have you had your PatChat yet?`,
  `Hi \${per1.name} and \${per2.name},

Just a friendly reminder that you were paired for PatChats this month!
If you haven't had your 30 minute coffee chat or video call yet, now's a great time to schedule it.
Don't forget to share a screenshot or selfie in the #pat-chats channel on the Discord server!

\${per1.name} (\${per1.email})
\${per2.name} (\${per2.email})

Let me know if you'd like to update your pairing information or be taken off the list.

Cheers,
Patina Network`,
);

export const RESTART_TEMPLATE: EmailTemplate = emailTemplate(
  `Restart`,
  `[PatChats] Restarting Patchats!`,
  `Hey \${per1.name}!

    • Getting PatChats restarted, opt-in by replying to this email.
    • To update your info, fill out this form: https://forms.gle/XggJPda2Yr3ZbJGH7

It's been a few months since I got PatChats out, as life has been pretty hectic, but we're looking to get it restarted!
Since it's been a while, let me know if you're still interested in getting paired each month by replying to this email.


As a refresher, PatChats is our monthly networking program, where we pair you with another member of the Patina community for a 30 minute coffee or video chat!
If you'd like to update any of your info, you can fill out the form again or reply with the update in this email. 

Here's the info we currently have:
    • Intro: "\${per1.intro:}"
    • Pairing Preferences: "\${per1.preferences:}"
    • Industry: "\${per1.industry:}"
    • Conversation Topics: "\${per1.topics:}"
    • Anything Else For Us: "\${per1.anything:}"

Cheers,
Patina Network

https://www.patinanetwork.org/`,
);

/** All templates: keyed by name for lookup and iteration in the admin UI. */
export const emailTemplateMap: Record<string, EmailTemplate> = {
  Sample: SAMPLE_TEMPLATE,
  Pair: PAIR_TEMPLATE,
  Reminder: REMINDER_TEMPLATE,
  Restart: RESTART_TEMPLATE,
};

export function getTemplate(name: string): EmailTemplate {
  return emailTemplateMap[name];
}

export function getAllTemplateNames(): string[] {
  return Object.keys(emailTemplateMap);
}
