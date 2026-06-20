import { config } from "./src/config.js";
import { parseStructuredResponse } from "./src/lib/openai.js";
import { z } from "zod";

const schema = z.object({
  ok: z.boolean(),
  message: z.string()
});

console.log("Config loaded:", {
  apiKey: config.openaiApiKey ? "PRESENT" : "MISSING",
  baseUrl: config.openaiBaseUrl,
  model: config.openaiModel
});

try {
  const result = await parseStructuredResponse({
    schema,
    name: "test",
    system: "You are a test assistant. Respond in JSON.",
    user: "Is the connection working? Respond with ok: true and a message."
  });
  console.log("Result:", result);
} catch (e) {
  console.error("Error calling LLM:", e);
}
