import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

interface EmailToSend {
  to: string;
  subject: string;
  html: string;
  link: string;
  label: string;
}

// Throws on any failure: these emails carry links the user cannot obtain any
// other way (confirm an account, reset a password), so the triggering request
// must fail loudly instead of silently losing the email.
async function sendEmail({
  to,
  subject,
  html,
  link,
  label,
}: EmailToSend): Promise<void> {
  if (env.NODE_ENV !== "production") {
    logger.info(
      { to, link },
      `Dev mode - skipping ${label} send. Use the logged link:`,
    );
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  let response: Awaited<ReturnType<typeof resend.emails.send>>;
  try {
    response = await resend.emails.send({
      from: `Atlas Univerziteta <${env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    });
  } catch (error: unknown) {
    logger.error({ to, err: error }, `Error sending ${label}`);
    throw error;
  }

  // the SDK reports API errors (bad key, unverified domain) in the resolved
  // response; only network failures throw
  if (response.error) {
    logger.error(
      { to, resendError: response.error },
      `Resend rejected the ${label}`,
    );
    throw new Error(`Resend rejected the ${label}: ${response.error.message}`);
  }

  logger.info({ to, messageId: response.data.id }, `Sent ${label}`);
}

export { sendEmail };
