import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const sendWelcomeEmail = async ({ to, username }) => {
  const mailOptions = {
    from: process.env.BREVO_SMTP_USER,
    to,
    subject: "Welcome to SNPL PORT",
    html: `
      <h1>Welcome to SNPL PORT, ${username}!</h1>
      <p>Thank you for signing up. We are excited to have you with us.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export { sendWelcomeEmail };
export default transporter;