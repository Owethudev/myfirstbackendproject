import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

// Get the current file path so we can resolve the backend .env file reliably.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend .env file.
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

const getApiKey = () => process.env.API_MAIL_KEY || process.env.MAIL_API_KEY;

// Reuse the same outbound email provider so verification and password-reset
// emails follow the same secure delivery path.
const sendEmailRequest = async ({ to, subject, html, from }) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("API_MAIL_KEY is not configured.");
  }

  const payload = JSON.stringify({ to, subject, html, from });

  const options = {
    hostname: "mailserver.automationlounge.com",
    port: 443,
    path: "/api/v1/messages/send",
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Promailer request failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

// Send a verification email to a newly registered user using the external mail API.
const sendVerificationEmail = async ({ to, username, verificationUrl }) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"SNPLPORT" <no-reply@example.com>';

  return sendEmailRequest({
    to,
    subject: "Verify your SNPLPORT account",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your SNPLPORT account</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:#4f46e5;padding:28px 30px;text-align:center;color:#ffffff;">
                <h1 style="margin:0;font-size:28px;letter-spacing:-0.04em;">SNPLPORT</h1>
                <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.9);">Email verification</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px 16px;color:#0f172a;">
                <p style="margin:0 0 18px;font-size:18px;font-weight:600;">Hi ${username},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#475569;">
                  Thanks for creating your SNPLPORT account. To get started, please confirm your email address by clicking the button below.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                <a href="${verificationUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:600;">Verify my email</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 18px;color:#64748b;font-size:14px;line-height:1.75;">
                <p style="margin:0 0 10px;">If the button does not work, copy and paste the link below into your browser:</p>
                <p style="margin:0;"><a href="${verificationUrl}" style="color:#4f46e5;word-break:break-all;text-decoration:none;">${verificationUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 30px;color:#475569;font-size:14px;line-height:1.75;border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 8px;">If you didn’t create this account, you can safely ignore this email.</p>
                <p style="margin:0;">Need help? Reply to this email and we’ll assist you.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    from,
  });
};

// Send a password reset email using the same provider and email flow.
const sendPasswordResetEmail = async ({ to, username, resetUrl }) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"SNPLPORT" <no-reply@example.com>';

  return sendEmailRequest({
    to,
    subject: "Reset your SNPLPORT password",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your SNPLPORT password</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:#4f46e5;padding:28px 30px;text-align:center;color:#ffffff;">
                <h1 style="margin:0;font-size:28px;letter-spacing:-0.04em;">SNPLPORT</h1>
                <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.9);">Password reset request</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px 16px;color:#0f172a;">
                <p style="margin:0 0 18px;font-size:18px;font-weight:600;">Hello ${username},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#475569;">
                  We received a request to reset your SNPLPORT password. Click the button below to choose a new password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:600;">Reset my password</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 18px;color:#64748b;font-size:14px;line-height:1.75;">
                <p style="margin:0 0 10px;">This link expires in 15 minutes.</p>
                <p style="margin:0 0 10px;">If the button does not work, paste this link into your browser:</p>
                <p style="margin:0;"><a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;text-decoration:none;">${resetUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 30px;color:#475569;font-size:14px;line-height:1.75;border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 8px;">If you did not request a password reset, you can ignore this email and your account will remain secure.</p>
                <p style="margin:0;">Need help? Reply to this message and we’ll help you out.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    from,
  });
};

// Export the function so the controller can call it during registration.
export { sendVerificationEmail, sendPasswordResetEmail };
export default sendVerificationEmail;
