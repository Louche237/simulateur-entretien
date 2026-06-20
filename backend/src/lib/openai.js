import OpenAI from "openai";
import { config } from "../config.js";

const client = config.openaiApiKey
  ? new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl, // pointe vers https://api.groq.com/openai/v1
    })
  : null;

export const hasOpenAI = Boolean(client);

function getSchemaFormat(schema) {
  if (!schema) return "any";
  
  const typeName = schema.constructor?.name;
  
  if (typeName === "ZodOptional" || typeName === "ZodNullable") {
    return getSchemaFormat(schema.unwrap());
  }
  
  if (typeName === "ZodEffects") {
    return getSchemaFormat(schema.innerType ? schema.innerType() : schema._def.schema);
  }
  
  if (typeName === "ZodObject") {
    const shape = schema.shape;
    const res = {};
    for (const key of Object.keys(shape)) {
      res[key] = getSchemaFormat(shape[key]);
    }
    return res;
  }
  
  if (typeName === "ZodArray") {
    let elem = getSchemaFormat(schema.element);
    if (typeof elem === "string" && schema.description) {
      elem += ` // ${schema.description}`;
    }
    return [elem];
  }
  
  let descStr = "";
  if (typeName === "ZodEnum") {
    descStr = `enum (${schema._def.values?.join(" | ") || ""})`;
  } else if (typeName === "ZodString") {
    descStr = "string";
  } else if (typeName === "ZodNumber") {
    descStr = "number";
  } else if (typeName === "ZodBoolean") {
    descStr = "boolean";
  } else {
    descStr = "any";
  }
  
  if (schema.description) {
    descStr += ` // ${schema.description}`;
  }
  
  return descStr;
}

/**
 * Appelle Groq via Chat Completions (compatible OpenAI SDK),
 * force une réponse JSON et valide avec le schéma Zod fourni.
 */
export async function parseStructuredResponse({
  model = config.openaiModel,
  schema,
  system,
  user,
  input, // conservé pour rétrocompatibilité mais ignoré si system/user sont présents
}) {
  if (!client) return null;

  let systemPrompt = system || "";
  if (schema) {
    const formatDesc = JSON.stringify(getSchemaFormat(schema), null, 2);
    systemPrompt += `\n\nYou MUST respond with a JSON object strictly matching the following schema structure:
${formatDesc}
Ensure all JSON keys match the schema exactly.`;
  }
  systemPrompt += "\n\nRespond ONLY with valid JSON. Do not wrap the JSON in markdown blocks (e.g. do NOT use ```json). Return only the raw JSON object.";

  // Construire les messages
  const messages =
    system || user
      ? [
          { role: "system", content: systemPrompt },
          { role: "user", content: user || "" },
        ]
      : input;

  const response = await client.chat.completions.create(
    {
      model,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" }, // Groq supporte json_object sur la plupart des modèles
    },
    {
      timeout: 20000, // 20 seconds timeout
    }
  );

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) return null;

  // Nettoyage défensif (retrait de blocs markdown si présents)
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Tentative de récupération si JSON partiel
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }

  // Validation Zod
  const result = schema.safeParse(parsed);
  if (result.success) return result.data;

  // Si la validation échoue, retourner le JSON brut quand même
  // (interview.js le normalise via normalizeAnswerReview / normalizeQuestionSet)
  return parsed;
}