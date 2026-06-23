export const requireAdmin = (req, res, next) => {
  if (!req.userRecord) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise",
    });
  }

  if (req.userRecord.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Accès réservé aux administrateurs",
    });
  }

  return next();
};
