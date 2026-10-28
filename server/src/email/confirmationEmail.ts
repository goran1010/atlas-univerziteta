import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Throws on any failure: with required email verification, a silently lost
// confirmation email leaves an account that can never log in, so the signup
// request itself must fail loudly instead.
async function sendConfirmationEmail(
  userEmail: string,
  confirmationLink: string,
): Promise<void> {
  if (env.NODE_ENV !== "production") {
    logger.info(
      { to: userEmail, confirmationLink },
      "Dev mode - skipping email send. Click the link to confirm:",
    );
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  let response: Awaited<ReturnType<typeof resend.emails.send>>;
  try {
    response = await resend.emails.send({
      from: `Atlas Univerziteta <${env.RESEND_FROM_EMAIL}>`,
      to: [userEmail],
      subject: "Confirm Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome!</h2>
          <p>Thank you for registering. Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}"
               style="background-color: #007bff; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${confirmationLink}">${confirmationLink}</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error: unknown) {
    logger.error(
      { to: userEmail, err: error },
      "Error sending confirmation email",
    );
    throw error;
  }

  // the SDK reports API errors (bad key, unverified domain) in the resolved
  // response; only network failures throw
  if (response.error) {
    logger.error(
      { to: userEmail, resendError: response.error },
      "Resend rejected the confirmation email",
    );
    throw new Error(`Confirmation email rejected: ${response.error.message}`);
  }

  logger.info(
    { to: userEmail, messageId: response.data.id },
    "Confirmation email sent",
  );
}

export { sendConfirmationEmail };
