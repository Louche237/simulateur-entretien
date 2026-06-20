import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || "";
const isGroq = apiKey.startsWith("gsk_") || Boolean(process.env.GROQ_API_KEY);

export const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
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
};