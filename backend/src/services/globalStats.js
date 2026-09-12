import { safeNumber } from "../lib/text.js";
import { User, Session } from "../models/index.js";

export const computeGlobalStats = async () => {
  const users = await User.findAll({
    order: [["createdAt", "DESC"]],
  });

  const sessions = await Session.findAll({
    order: [["createdAt", "DESC"]],
  });

  const totalUsers = users.length;
  const totalConfirmedUsers = users.filter((u) => u.emailConfirmed).length;
  const totalUnconfirmedUsers = totalUsers - totalConfirmedUsers;
  const totalSessions = sessions.length;
  const finishedSessions = sessions.filter((s) => s.status === "terminee");

  const totalScore = finishedSessions.reduce(
    (sum, session) => sum + safeNumber(session.score, 0),
    0
  );

  const averageScore = finishedSessions.length
    ? Math.round(totalScore / finishedSessions.length)
    : 0;

  const sessionsByDate = {};
  finishedSessions.forEach((session) => {
    const rawDate = session.finishedAt || session.createdAt;
    const date = new Date(rawDate).toISOString().split("T")[0];
    sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
  });

  const usersByDate = {};
  users.forEach((user) => {
    const date = new Date(user.createdAt).toISOString().split("T")[0];
    usersByDate[date] = (usersByDate[date] || 0) + 1;
  });

  const topUsers = users
    .map((user) => {
      const userSessions = finishedSessions.filter((s) => s.userId === user.id);
      const userAvgScore = userSessions.length
        ? Math.round(
            userSessions.reduce((sum, s) => sum + safeNumber(s.score, 0), 0) /
              userSessions.length
          )
        : 0;
      return {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
        sessionsCount: userSessions.length,
        averageScore: userAvgScore,
      };
    })
    .sort((a, b) => b.sessionsCount - a.sessionsCount)
    .slice(0, 10);

  return {
    totalUsers,
    totalConfirmedUsers,
    totalUnconfirmedUsers,
    totalSessions,
    finishedSessions: finishedSessions.length,
    averageScore,
    sessionsByDate,
    usersByDate,
    topUsers,
  };
};
