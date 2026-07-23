import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE !== "false";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async ({ to, username, verificationUrl }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '"SNPLPORT" <no-reply@example.com>',
    to,
    subject: "Verify your SNPLPORT account",
    html: `
      <h1>Welcome to SNPLPORT, ${username}!</h1>
      <p>Please verify your account by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify your email</a></p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export { sendVerificationEmail };
export default transporter;
