import { Resend } from "resend";

type SendSystemEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export class MailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailConfigError";
  }
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new MailConfigError("Email service is not configured.");
  }

  return new Resend(apiKey);
}

function getSystemFromEmail() {
  const from = process.env.SYSTEM_FROM_EMAIL;

  if (!from) {
    throw new MailConfigError("System sender email is not configured.");
  }

  return from;
}

export async function sendSystemEmail({
  to,
  subject,
  html,
  text,
}: SendSystemEmailInput) {
  const resend = getResendClient();
  const from = getSystemFromEmail();

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    throw new Error("Unable to send email right now.");
  }

  return result;
}
