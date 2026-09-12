import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { computeGlobalStats } from "../services/globalStats.js";
import {
  createUserRecord,
  deleteUserRecord,
  getUserRecordById,
  listAllUsers,
  toPublicUser,
  updateUserRecord,
} from "../services/users.js";
import {
  deleteSessionRecord,
  getSessionRecord,
  listAllSessionsAdmin,
} from "../services/sessions.js";
import { User, Session, QuestionBank, SystemSetting, sequelize } from "../models/index.js";
import { testDbConnection } from "../db/sequelize.js";
import { initializeDatabase } from "../db/initDb.js";
import { DEFAULT_QUESTION_BANK } from "../constants.js";
import { makeId } from "../lib/text.js";
import { hashPassword } from "../lib/auth.js";

const router = express.Router();

// Strict security: every admin route requires valid token and role === 'admin'
router.use(requireAuth);
router.use(requireAdmin);

// ── 1. STATS ───────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const stats = await computeGlobalStats();
    return res.json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── 2. USERS MANAGEMENT (CRUD) ─────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const users = await listAllUsers();
    return res.json({
      success: true,
      users: users.map(toPublicUser),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const createUserSchema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis"),
  nom: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
  role: z.enum(["user", "admin"]).optional().default("user"),
  emailConfirmed: z.boolean().optional().default(true),
});

router.post("/users", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors: parsed.error.issues,
    });
  }

  const existing = await User.findOne({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Un utilisateur avec cet email existe déjà",
    });
  }

  const user = await createUserRecord(parsed.data);
  return res.status(201).json({
    success: true,
    user: toPublicUser(user),
    message: "Utilisateur créé avec succès",
  });
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await getUserRecordById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
  }

  const userSessions = await Session.findAll({
    where: { userId: id },
    order: [["createdAt", "DESC"]],
  });

  return res.json({
    success: true,
    user: toPublicUser(user),
    sessions: userSessions,
  });
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const updatedUser = await updateUserRecord(id, req.body);
  if (!updatedUser) {
    return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
  }
  return res.json({ success: true, user: toPublicUser(updatedUser) });
});

router.put("/users/:id/password", async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({
      success: false,
      message: "Le nouveau mot de passe doit comporter au moins 6 caractères",
    });
  }

  const user = await getUserRecordById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
  }

  await user.update({ passwordHash: hashPassword(String(newPassword)) });
  return res.json({ success: true, message: "Mot de passe réinitialisé avec succès" });
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  if (req.user.id === id) {
    return res.status(400).json({
      success: false,
      message: "Impossible de supprimer votre propre compte administrateur en cours d'utilisation",
    });
  }

  const deleted = await deleteUserRecord(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
  }
  return res.json({ success: true, message: "Utilisateur supprimé" });
});

// ── 3. SESSIONS MANAGEMENT ─────────────────────────────────────
router.get("/sessions", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const status = req.query.status ? String(req.query.status) : undefined;
    const sessions = await listAllSessionsAdmin({ limit, status });
    return res.json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const session = await getSessionRecord(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session introuvable" });
    }
    return res.json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  try {
    const deleted = await deleteSessionRecord(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Session introuvable" });
    }
    return res.json({ success: true, message: "Session supprimée" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── 4. QUESTIONS BANK (CRUD) ───────────────────────────────────
router.get("/questions", async (req, res) => {
  try {
    const questions = await QuestionBank.findAll({
      order: [["category", "ASC"], ["createdAt", "ASC"]],
    });
    return res.json({ success: true, questions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/questions", async (req, res) => {
  const { category, text, focus, followUp, isActive } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ success: false, message: "Le texte de la question est requis" });
  }

  try {
    const created = await QuestionBank.create({
      id: makeId("qbk"),
      category: category || "general",
      text: String(text).trim(),
      focus: focus ? String(focus).trim() : null,
      followUp: followUp ? String(followUp).trim() : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
    return res.status(201).json({ success: true, question: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const question = await QuestionBank.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question introuvable" });
    }

    const { category, text, focus, followUp, isActive } = req.body;
    await question.update({
      category: category !== undefined ? category : question.category,
      text: text !== undefined ? String(text).trim() : question.text,
      focus: focus !== undefined ? String(focus).trim() : question.focus,
      followUp: followUp !== undefined ? String(followUp).trim() : question.followUp,
      isActive: isActive !== undefined ? Boolean(isActive) : question.isActive,
    });

    return res.json({ success: true, question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const question = await QuestionBank.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question introuvable" });
    }

    await question.destroy();
    return res.json({ success: true, message: "Question supprimée" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/questions/reset", async (req, res) => {
  try {
    await QuestionBank.destroy({ where: {} });
    for (const q of DEFAULT_QUESTION_BANK) {
      await QuestionBank.create({
        id: q.id,
        category: q.category || "general",
        text: q.text,
        isActive: true,
      });
    }
    const questions = await QuestionBank.findAll();
    return res.json({
      success: true,
      message: "Banque de questions réinitialisée avec succès",
      count: questions.length,
      questions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── 5. DATABASE STATUS & SYSTEM TOOLS ──────────────────────────
router.get("/db/status", async (req, res) => {
  try {
    const conn = await testDbConnection();
    const [userCount, sessionCount, questionCount] = await Promise.all([
      User.count().catch(() => 0),
      Session.count().catch(() => 0),
      QuestionBank.count().catch(() => 0),
    ]);

    return res.json({
      success: true,
      db: {
        ...conn,
        dialect: "mysql",
        counts: {
          users: userCount,
          sessions: sessionCount,
          questions: questionCount,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/db/sync", async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    return res.json({
      success: true,
      message: "Synchronisation de la base de données MySQL terminée avec succès.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/db/init", async (req, res) => {
  try {
    const result = await initializeDatabase({ seed: true, migrate: true });
    return res.json({
      success: result.ok,
      message: result.ok
        ? "Base MySQL initialisée, tables synchronisées et données vérifiées."
        : "Erreur : " + result.error,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
