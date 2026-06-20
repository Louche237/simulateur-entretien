import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { computeUserStats } from "../services/stats.js";
import {
  deleteUserRecord,
  toPublicUser,
  updatePasswordRecord,
  updateUserRecord,
} from "../services/users.js";

const router = express.Router();

router.use(requireAuth);

const profileSchema = z.object({
  prenom: z.string().trim().optional(),
  nom: z.string().trim().optional(),
  langue: z.enum(["fr", "en"]).optional(),
  email: z.string().trim().email().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "8 caractères minimum"),
});

router.get("/profil", (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

router.put("/profil", (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données de profil invalides",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path[0] || "general",
        msg: issue.message,
      })),
    });
  }

  const updated = updateUserRecord(req.user.id, parsed.data);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable",
    });
  }

  return res.json({
    success: true,
    user: toPublicUser(updated),
  });
});

router.put("/password", (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path[0] || "general",
        msg: issue.message,
      })),
    });
  }

  const result = updatePasswordRecord(
    req.user.id,
    parsed.data.currentPassword,
    parsed.data.newPassword
  );

  if (!result.ok) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  return res.json({
    success: true,
    message: "Mot de passe mis à jour",
  });
});

router.get("/stats", (req, res) => {
  return res.json({
    success: true,
    stats: computeUserStats(req.user.id),
  });
});

router.delete("/compte", (req, res) => {
  deleteUserRecord(req.user.id);
  return res.json({
    success: true,
    message: "Compte supprimé",
  });
});

export default router;
