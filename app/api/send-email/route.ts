import { MailConfigError, sendSystemEmail } from "@/lib/mail";

type SendEmailRequest = {
  email?: string;
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
  return `<p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendEmailRequest;
    const email = body.email?.trim();
    const subject = body.subject?.trim();
    const message = body.message?.trim();

    if (!isNonEmptyString(email) || !isNonEmptyString(subject) || !isNonEmptyString(message)) {
      return Response.json(
        { success: false, error: "Missing required fields: email, subject, and message." },
        { status: 400 },
      );
    }

    await sendSystemEmail({
      to: email,
      subject,
      html: buildHtml(message),
      text: message,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof MailConfigError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return Response.json(
      { success: false, error: "Invalid request or unexpected server error." },
      { status: 500 },
    );
  }
}
