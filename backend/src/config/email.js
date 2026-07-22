import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async ({ to, username, verificationUrl }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Verify your SNPL PORT account",
    html: `
      <h1>Welcome to SNPL PORT, ${username}!</h1>
      <p>Please verify your account by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify your email</a></p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export { sendVerificationEmail };
export default transporter;