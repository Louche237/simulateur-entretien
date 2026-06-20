import express from "express";
import { z } from "zod";
import { DEFAULT_QUESTION_BANK } from "../constants.js";
import { buildInterviewSessionQuestions } from "../services/interview.js";
import { readDb, updateDb } from "../store.js";

const router = express.Router();

const querySchema = z.object({
  poste: z.string().optional(),
  entreprise: z.string().optional(),
  niveau: z.string().optional(),
  difficulte: z.string().optional(),
  recruteur: z.string().optional(),
  surprises: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
  duree: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => Number(value || 10)),
  langue: z.enum(["fr", "en"]).optional(),
  description: z.string().optional(),
  cvSummary: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.union([z.string(), z.number()]).optional(),
});

router.get("/questions", async (req, res) => {
  const parsed = querySchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Paramètres invalides",
    });
  }

  const hasContext = Boolean(
    parsed.data.poste ||
      parsed.data.entreprise ||
      parsed.data.description ||
      parsed.data.cvSummary ||
      parsed.data.skills
  );

  if (!hasContext) {
    const db = readDb();
    return res.json({
      success: true,
      questions: db.questionBank || DEFAULT_QUESTION_BANK,
    });
  }

  const skills = Array.isArray(parsed.data.skills)
    ? parsed.data.skills
    : parsed.data.skills
      ? [parsed.data.skills]
      : [];

  const questions = await buildInterviewSessionQuestions({
    ...parsed.data,
    skills,
    langue: parsed.data.langue || "fr",
  });

  return res.json({
    success: true,
    ...questions,
  });
});

router.post("/seed", (req, res) => {
  updateDb((db) => {
    db.questionBank = DEFAULT_QUESTION_BANK;
    return db;
  });

  return res.json({
    success: true,
    count: DEFAULT_QUESTION_BANK.length,
  });
});

export default router;
