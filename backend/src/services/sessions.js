import { makeId, safeNumber } from "../lib/text.js";
import { Session, User } from "../models/index.js";
import { Op } from "sequelize";

export const normalizeQuestion = (question, index) => ({
  id: question?.id || `q-${index + 1}`,
  text: String(question?.text || question || "").trim(),
  answer: String(question?.answer || "").trim(),
  category: question?.category || "general",
  focus: question?.focus || "",
  followUp: question?.followUp || "",
  coachingTips: Array.isArray(question?.coachingTips) ? question.coachingTips : [],
  analysis: question?.analysis || null,
});

export const normalizeSession = (rawSession) => {
  if (!rawSession) return null;
  const session = typeof rawSession.get === "function" ? rawSession.get({ plain: true }) : { ...rawSession };

  return {
    ...session,
    questions: Array.isArray(session.questions)
      ? session.questions.map((question, index) => normalizeQuestion(question, index))
      : [],
    score: session.score ?? null,
    feedback: session.feedback ?? null,
    review: session.review ?? null,
  };
};

export const createSessionRecord = async ({ userId, config, questions }) => {
  const normalizedQuestions = Array.isArray(questions)
    ? questions.map((q, idx) => normalizeQuestion(q, idx))
    : [];

  const session = await Session.create({
    id: makeId("ses"),
    userId,
    source: "local",
    status: "en_cours",
    poste: String(config.poste || "").trim(),
    entreprise: String(config.entreprise || "").trim(),
    niveau: config.niveau || "debutant",
    difficulte: config.difficulte || "facile",
    recruteur: config.recruteur || "aria",
    surprises: Boolean(config.surprises),
    duree: safeNumber(config.duree, 10),
    langue: config.langue || "fr",
    description: String(config.description || "").trim(),
    cvName: String(config.cvName || "").trim(),
    type: config.type || "rh",
    questions: normalizedQuestions,
    score: null,
    feedback: null,
    review: null,
    finishedAt: null,
  });

  return normalizeSession(session);
};

export const upsertSessionRecord = async (sessionData) => {
  const normalized = normalizeSession(sessionData);
  const [session] = await Session.upsert({
    ...normalized,
    updatedAt: new Date(),
  });
  return normalizeSession(session);
};

export const getSessionRecord = async (sessionId, userId) => {
  if (!sessionId) return null;
  const where = { id: sessionId };
  if (userId) where.userId = userId;

  const session = await Session.findOne({
    where,
    include: [{ model: User, as: "user", attributes: ["id", "prenom", "nom", "email"] }],
  });

  return normalizeSession(session);
};

export const listSessionRecords = async (userId, { limit, status } = {}) => {
  const where = { userId };
  if (status) where.status = status;

  const sessions = await Session.findAll({
    where,
    limit: limit ? safeNumber(limit, 50) : undefined,
    order: [["createdAt", "DESC"]],
  });

  return sessions.map(normalizeSession);
};

export const listAllSessionsAdmin = async ({ limit = 100, status } = {}) => {
  const where = {};
  if (status) where.status = status;

  const sessions = await Session.findAll({
    where,
    include: [{ model: User, as: "user", attributes: ["id", "prenom", "nom", "email"] }],
    limit: safeNumber(limit, 100),
    order: [["createdAt", "DESC"]],
  });

  return sessions.map(normalizeSession);
};

export const updateSessionAnswerRecord = async ({
  sessionId,
  userId,
  questionId,
  questionIndex,
  answer,
  analysis,
}) => {
  const session = await Session.findOne({
    where: { id: sessionId, userId },
  });
  if (!session) return null;

  const questions = Array.isArray(session.questions) ? [...session.questions] : [];
  const targetIdx = Number.isFinite(Number(questionIndex))
    ? Number(questionIndex)
    : questions.findIndex((q) => q.id === questionId);

  if (targetIdx >= 0 && targetIdx < questions.length) {
    questions[targetIdx] = {
      ...questions[targetIdx],
      answer: String(answer || "").trim(),
      analysis: analysis || questions[targetIdx].analysis || null,
    };

    await session.update({
      questions,
      updatedAt: new Date(),
    });
  }

  return normalizeSession(session);
};

export const finishSessionRecord = async ({
  sessionId,
  userId,
  completedSession,
  review,
}) => {
  let session = await Session.findOne({
    where: { id: sessionId, userId },
  });

  const updateData = {
    status: "terminee",
    finishedAt: new Date(),
    score: review?.score ?? completedSession?.score ?? session?.score ?? null,
    feedback:
      completedSession?.feedback ||
      review?.feedback || {
        summary: review?.summary || "Session terminée.",
        answered: review?.answered ?? 0,
        total: review?.total ?? 0,
      },
    review: review || completedSession?.review || session?.review || null,
  };

  if (completedSession?.questions) {
    updateData.questions = completedSession.questions;
  }

  if (session) {
    await session.update(updateData);
  } else {
    session = await Session.create({
      id: sessionId,
      userId,
      ...completedSession,
      ...updateData,
    });
  }

  return normalizeSession(session);
};

export const deleteSessionRecord = async (sessionId, userId) => {
  const where = { id: sessionId };
  if (userId) where.userId = userId;

  const count = await Session.destroy({ where });
  return count > 0;
};
