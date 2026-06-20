import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  analyzeInterviewAnswer,
  analyzeInterviewSession,
  buildInterviewSessionQuestions,
} from "../services/interview.js";
import {
  createSessionRecord,
  deleteSessionRecord,
  finishSessionRecord,
  getSessionRecord,
  listSessionRecords,
  normalizeSession,
  updateSessionAnswerRecord,
} from "../services/sessions.js";

const router = express.Router();

router.use(requireAuth);

const createSessionSchema = z.object({
  poste: z.string().trim().min(1, "Poste requis"),
  entreprise: z.string().trim().optional().default(""),
  niveau: z.string().trim().optional().default("debutant"),
  difficulte: z.string().trim().optional().default("facile"),
  recruteur: z.string().trim().optional().default("aria"),
  surprises: z.boolean().optional().default(false),
  duree: z.coerce.number().int().min(5).max(60).optional().default(10),
  langue: z.enum(["fr", "en"]).optional().default("fr"),
  description: z.string().trim().optional().default(""),
  cvName: z.string().trim().optional().default(""),
  cvSummary: z.string().trim().optional(),
  skills: z.array(z.string()).optional(),
  type: z.string().trim().optional().default("rh"),
});

const answerSchema = z.object({
  questionId: z.string().optional(),
  questionIndex: z.union([z.string(), z.number()]).optional(),
  answer: z.string().optional().default(""),
});

const finishSchema = z.object({
  session: z.any().optional(),
  reason: z.string().optional(),
});

router.post("/", async (req, res) => {
  const parsed = createSessionSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données de session invalides",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path[0] || "general",
        msg: issue.message,
      })),
    });
  }

  const questions = await buildInterviewSessionQuestions({
    ...parsed.data,
    langue: parsed.data.langue || req.user.langue || "fr",
  });

  const session = createSessionRecord({
    userId: req.user.id,
    config: parsed.data,
    questions: questions.questions,
  });

  return res.status(201).json({
    success: true,
    session: {
      ...session,
      questions: session.questions,
      coachTips: questions.coachTips,
      title: questions.title,
      intro: questions.intro,
    },
  });
});

router.get("/", (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const sessions = listSessionRecords(req.user.id, { limit, status });

  return res.json({
    success: true,
    sessions,
  });
});

router.get("/:id", (req, res) => {
  const session = getSessionRecord(req.params.id, req.user.id);
  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session introuvable",
    });
  }

  return res.json({
    success: true,
    session,
  });
});

router.post("/:id/reponse", async (req, res) => {
  const parsed = answerSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Réponse invalide",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path[0] || "general",
        msg: issue.message,
      })),
    });
  }

  const session = getSessionRecord(req.params.id, req.user.id);
  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session introuvable",
    });
  }

  const questionIndex = Number.isFinite(Number(parsed.data.questionIndex))
    ? Number(parsed.data.questionIndex)
    : session.questions.findIndex((question) => question.id === parsed.data.questionId);

  if (questionIndex < 0 || questionIndex >= session.questions.length) {
    return res.status(404).json({
      success: false,
      message: "Question introuvable",
    });
  }

  const question = session.questions[questionIndex];
  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question introuvable",
    });
  }

  const analysis = await analyzeInterviewAnswer({
    question: question.text,
    answer: parsed.data.answer || "",
    poste: session.poste,
    entreprise: session.entreprise,
    niveau: session.niveau,
    difficulte: session.difficulte,
    recruteur: session.recruteur,
    langue: session.langue,
  });

  const updated = updateSessionAnswerRecord({
    sessionId: session.id,
    userId: req.user.id,
    questionId: question.id,
    questionIndex,
    answer: parsed.data.answer || "",
    analysis,
  });

  return res.json({
    success: true,
    session: updated,
    analysis,
  });
});

router.put("/:id/terminer", async (req, res) => {
  const parsed = finishSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données de clôture invalides",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path[0] || "general",
        msg: issue.message,
      })),
    });
  }

  const stored = getSessionRecord(req.params.id, req.user.id);
  const incoming = parsed.data.session && typeof parsed.data.session === "object"
    ? normalizeSession(parsed.data.session)
    : null;

  const baseSession = incoming || stored;

  if (!baseSession) {
    return res.status(404).json({
      success: false,
      message: "Session introuvable",
    });
  }

  const review = await analyzeInterviewSession({
    ...baseSession,
    id: req.params.id,
    userId: req.user.id,
    langue: baseSession.langue || req.user.langue || "fr",
  });

  const completed = finishSessionRecord({
    sessionId: req.params.id,
    userId: req.user.id,
    completedSession: {
      ...baseSession,
      status: "terminee",
      score: review.score,
      feedback: {
        summary: review.summary,
        answered: review.answered,
        total: review.total,
      },
      review,
    },
    review,
  });

  return res.json({
    success: true,
    session: completed,
    review,
  });
});

router.delete("/:id", (req, res) => {
  const session = getSessionRecord(req.params.id, req.user.id);
  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session introuvable",
    });
  }

  deleteSessionRecord(req.params.id, req.user.id);
  return res.json({
    success: true,
    message: "Session supprimée",
  });
});

export default router;
