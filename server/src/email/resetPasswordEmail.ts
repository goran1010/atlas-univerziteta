import { sendEmail } from "./sendEmail.js";

async function sendResetPasswordEmail(
  userEmail: string,
  resetLink: string,
): Promise<void> {
  await sendEmail({
    to: userEmail,
    subject: "Reset Your Password",
    link: resetLink,
    label: "password reset email",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}"
             style="background-color: #007bff; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetLink}">${resetLink}</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you didn't request a password reset, you can safely ignore this email - your password will stay unchanged.
        </p>
      </div>
    `,
  });
}

export { sendResetPasswordEmail };
