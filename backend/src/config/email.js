import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

const getApiKey = () => {
  const fromEnv = process.env.API_MAIL_KEY || process.env.MAIL_API_KEY;
  if (fromEnv) return fromEnv;

  try {
    const envFile = fs.readFileSync(envPath, "utf8");
    const match = envFile.match(/API_MAIL_KEY=(.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
};

const fallbackApiKey = "a99cb26a-3013-4168-bac6-8039d0c4405e";

const sendVerificationEmail = async ({ to, username, verificationUrl }) => {
  const apiKey = getApiKey() || fallbackApiKey;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"SNPLPORT" <no-reply@example.com>';

  if (!apiKey) {
    throw new Error("API_MAIL_KEY is not configured.");
  }

  const payload = JSON.stringify({
    to,
    subject: "Verify your SNPLPORT account",
    html: `
      <h1>Welcome to SNPLPORT, ${username}!</h1>
      <p>Please verify your account by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify your email</a></p>
    `,
    from,
  });

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

export { sendVerificationEmail };
export default sendVerificationEmail;
