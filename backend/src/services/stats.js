import { readDb } from "../store.js";
import { safeNumber } from "../lib/text.js";

export const computeUserStats = (userId) => {
  const db = readDb();
  const sessions = db.sessions.filter((session) => session.userId === userId);
  const finished = sessions.filter((session) => session.status === "terminee");

  const totalSessions = finished.length;
  const scoreMoyen = totalSessions
    ? Math.round(
        finished.reduce((sum, session) => sum + safeNumber(session.score, 0), 0) /
          totalSessions
      )
    : 0;

  const meilleurScore = finished.reduce(
    (best, session) => Math.max(best, safeNumber(session.score, 0)),
    0
  );

  const tempsTotal = finished.reduce(
    (sum, session) => sum + safeNumber(session.duree, 0),
    0
  );

  const sorted = [...finished].sort((left, right) => {
    const leftDate = new Date(left.finishedAt || left.createdAt || 0).getTime();
    const rightDate = new Date(right.finishedAt || right.createdAt || 0).getTime();
    return leftDate - rightDate;
  });

  const lastScore = safeNumber(sorted.at(-1)?.score, 0);
  const previousScore = safeNumber(sorted.at(-2)?.score, lastScore);
  const diff = lastScore - previousScore;

  return {
    totalSessions,
    scoreMoyen,
    tempsTotal,
    meilleurScore,
    amelioration: totalSessions > 1 ? `${diff >= 0 ? "+" : ""}${diff}%` : "N/A",
    badges: Math.min(4, totalSessions),
    objectifMensuel: 20,
    scoreCible: 85,
  };
};
