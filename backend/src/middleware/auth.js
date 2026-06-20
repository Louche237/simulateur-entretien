import { verifyToken } from "../lib/auth.js";
import { getUserRecordById, toPublicUser } from "../services/users.js";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise",
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = getUserRecordById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session invalide",
      });
    }

    req.user = toPublicUser(user);
    req.userRecord = user;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré",
    });
  }
};
