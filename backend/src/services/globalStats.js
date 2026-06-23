import { readDb } from "../store.js";
import { safeNumber } from "../lib/text.js";

export const computeGlobalStats = () => {
  const db = readDb();
  
  const totalUsers = db.users.length;
  const totalSessions = db.sessions.length;
  const finishedSessions = db.sessions.filter(s => s.status === "terminee");
  
  const totalScore = finishedSessions.reduce(
    (sum, session) => sum + safeNumber(session.score, 0),
    0
  );
  
  const averageScore = finishedSessions.length 
    ? Math.round(totalScore / finishedSessions.length) 
    : 0;

  const sessionsByDate = {};
  finishedSessions.forEach(session => {
    const date = new Date(session.finishedAt || session.createdAt).toISOString().split('T')[0];
    if (!sessionsByDate[date]) {
      sessionsByDate[date] = 0;
    }
    sessionsByDate[date]++;
  });

  const usersByDate = {};
  db.users.forEach(user => {
    const date = new Date(user.createdAt).toISOString().split('T')[0];
    if (!usersByDate[date]) {
      usersByDate[date] = 0;
    }
    usersByDate[date]++;
  });

  return {
    totalUsers,
    totalSessions,
    finishedSessions: finishedSessions.length,
    averageScore,
    sessionsByDate,
    usersByDate,
    topUsers: db.users
      .map(user => {
        const userSessions = finishedSessions.filter(s => s.userId === user.id);
        const userAvgScore = userSessions.length
          ? Math.round(userSessions.reduce((sum, s) => sum + safeNumber(s.score, 0), 0) / userSessions.length)
          : 0;
        return {
          id: user.id,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          sessionsCount: userSessions.length,
          averageScore: userAvgScore,
        };
      })
      .sort((a, b) => b.sessionsCount - a.sessionsCount)
      .slice(0, 10),
  };
};
