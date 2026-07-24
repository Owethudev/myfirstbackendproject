import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import https from "https";

// Get the current file path so we can resolve the backend .env file reliably.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend .env file.
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

// Read the mail API key from the environment first, then fall back to scanning the .env file text.
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

// Backup token if no real API key is available.
const fallbackApiKey = "a99cb26a-3013-4168-bac6-8039d0c4405e";

// Send a verification email to a newly registered user using the external mail API.
const sendVerificationEmail = async ({ to, username, verificationUrl }) => {
  // Use the configured API key, or the fallback key if one is not available.
  const apiKey = getApiKey() || fallbackApiKey;

  // Determine which email address should appear as the sender.
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"SNPLPORT" <no-reply@example.com>';

  // Stop early if there is still no usable API key.
  if (!apiKey) {
    throw new Error("API_MAIL_KEY is not configured.");
  }

  // Build the JSON request body that the mail service expects.
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

  // Configure the HTTPS request to the mail server endpoint.
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

  // Send the request and resolve or reject based on the HTTP response.
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

// Export the function so the controller can call it during registration.
export { sendVerificationEmail };
export default sendVerificationEmail;
