import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

dotenv.config();
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: path.join(backendRoot, ".env.local"), override: true });

const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || "";
const isGroq = apiKey.startsWith("gsk_") || Boolean(process.env.GROQ_API_KEY);

export const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  adminInviteCode: process.env.ADMIN_INVITE_CODE || "ADMIN2026",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || "jobmentor_db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    logging: process.env.NODE_ENV === "development" ? false : false,
  },
  openaiApiKey: apiKey,
  openaiBaseUrl:
    process.env.OPENAI_BASE_URL ||
    process.env.GROQ_BASE_URL ||
    (isGroq
      ? "https://api.groq.com/openai/v1"
      : "https://api.openai.com/v1"),
  openaiModel:
    process.env.OPENAI_MODEL ||
    (isGroq ? "llama-3.3-70b-versatile" : "gpt-4o"),
  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "JobMentor <noreply@jobmentor.fr>",
  },
};