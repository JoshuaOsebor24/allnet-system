import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendDelegateEmailRequest = {
  to?: string;
  subject?: string;
  message?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml(message: string) {
  return escapeHtml(message).replaceAll("\n", "<br />");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendDelegateEmailRequest;
    const to = body.to?.trim();
    const subject = body.subject?.trim();
    const message = body.message?.trim();

    if (!isNonEmptyString(to) || !isNonEmptyString(subject) || !isNonEmptyString(message)) {
      return Response.json(
        { success: false, error: "Missing required fields: to, subject, and message." },
        { status: 400 },
      );
    }

    if (!resend) {
      return Response.json(
        { success: false, error: "Email service is not configured." },
        { status: 500 },
      );
    }

    if (!isNonEmptyString(process.env.RESEND_FROM_EMAIL)) {
      return Response.json(
        { success: false, error: "Sender email is not configured." },
        { status: 500 },
      );
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html: buildHtml(message),
      text: message,
    });

    if (result.error) {
      return Response.json(
        { success: false, error: "Unable to send email right now." },
        { status: 502 },
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: "Invalid request or unexpected server error." },
      { status: 500 },
    );
  }
}
