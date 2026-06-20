import { makeId, safeNumber } from "../lib/text.js";
import { readDb, updateDb } from "../store.js";

const normalizeQuestion = (question, index) => ({
  id: question.id || `q-${index + 1}`,
  text: String(question.text || question || "").trim(),
  answer: String(question.answer || "").trim(),
  category: question.category || "general",
  focus: question.focus || "",
  followUp: question.followUp || "",
  coachingTips: Array.isArray(question.coachingTips) ? question.coachingTips : [],
  analysis: question.analysis || null,
});

export const normalizeSession = (session) => ({
  ...session,
  questions: Array.isArray(session.questions)
    ? session.questions.map((question, index) => normalizeQuestion(question, index))
    : [],
  score: session.score ?? null,
  feedback: session.feedback ?? null,
  review: session.review ?? null,
});

export const createSessionRecord = ({ userId, config, questions }) => {
  const session = normalizeSession({
    id: makeId("ses"),
    userId,
    source: "local",
    status: "en_cours",
    createdAt: new Date().toISOString(),
    finishedAt: null,
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
    questions: Array.isArray(questions) ? questions : [],
  });

  updateDb((db) => {
    db.sessions.unshift(session);
    return db;
  });

  return session;
};

export const upsertSessionRecord = (session) => {
  const normalized = normalizeSession(session);

  updateDb((db) => {
    const index = db.sessions.findIndex((entry) => entry.id === normalized.id);

    if (index === -1) {
      db.sessions.unshift(normalized);
    } else {
      db.sessions[index] = normalized;
    }

    return db;
  });

  return normalized;
};

export const getSessionRecord = (sessionId, userId) => {
  const db = readDb();
  return (
    db.sessions.find((session) => {
      if (session.id !== sessionId) return false;
      if (!userId) return true;
      return session.userId === userId;
    }) || null
  );
};

export const listSessionRecords = (userId, { limit, status } = {}) => {
  const db = readDb();
  const sessions = db.sessions
    .filter((session) => session.userId === userId)
    .filter((session) => (status ? session.status === status : true))
    .sort((left, right) => {
      const leftDate = new Date(left.createdAt || 0).getTime();
      const rightDate = new Date(right.createdAt || 0).getTime();
      return rightDate - leftDate;
    });

  if (limit) {
    return sessions.slice(0, safeNumber(limit, sessions.length));
  }

  return sessions;
};

export const updateSessionAnswerRecord = ({
  sessionId,
  userId,
  questionId,
  questionIndex,
  answer,
  analysis,
}) => {
  let updated = null;

  updateDb((db) => {
    const session = db.sessions.find(
      (entry) => entry.id === sessionId && entry.userId === userId
    );
    if (!session) return db;

    session.questions = (session.questions || []).map((question, index) => {
      const isTarget =
        (questionId && question.id === questionId) ||
        (questionIndex !== undefined && index === questionIndex);

      if (!isTarget) return question;

      return {
        ...question,
        answer: String(answer || "").trim(),
        analysis: analysis || question.analysis || null,
      };
    });

    session.updatedAt = new Date().toISOString();
    updated = session;
    return db;
  });

  return updated;
};

export const finishSessionRecord = ({
  sessionId,
  userId,
  completedSession,
  review,
}) => {
  let saved = null;

  updateDb((db) => {
    const index = db.sessions.findIndex(
      (entry) => entry.id === sessionId && entry.userId === userId
    );

    const base = index >= 0 ? db.sessions[index] : null;
    const session = normalizeSession({
      ...(base || {}),
      ...(completedSession || {}),
      id: sessionId,
      userId,
      status: "terminee",
      finishedAt: new Date().toISOString(),
      score: review?.score ?? completedSession?.score ?? base?.score ?? null,
      feedback:
        completedSession?.feedback ||
        review?.feedback || {
          summary: review?.summary || "Session terminée.",
          answered: review?.answered ?? 0,
          total: review?.total ?? 0,
        },
      review: review || completedSession?.review || base?.review || null,
    });

    if (index >= 0) {
      db.sessions[index] = session;
    } else {
      db.sessions.unshift(session);
    }

    saved = session;
    return db;
  });

  return saved;
};

export const deleteSessionRecord = (sessionId, userId) => {
  updateDb((db) => {
    db.sessions = db.sessions.filter(
      (session) => !(session.id === sessionId && session.userId === userId)
    );
    return db;
  });
};
