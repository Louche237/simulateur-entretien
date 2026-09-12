import express from "express";
import { z } from "zod";
import { comparePassword, signToken } from "../lib/auth.js";
import { sendConfirmationEmail, sendWelcomeEmail } from "../lib/email.js";
import { config } from "../config.js";
import {
  confirmUserEmail,
  createUserRecord,
  getUserRecordByEmail,
  toPublicUser,
} from "../services/users.js";

const router = express.Router();

const registerSchema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis"),
  nom: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const validationErrors = (error) =>
  error.issues.map((issue) => ({
    path: issue.path[0] || "general",
    msg: issue.message,
  }));

router.post("/inscription", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données d'inscription invalides",
      errors: validationErrors(parsed.error),
    });
  }

  const existing = await getUserRecordByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Un compte existe déjà avec cette adresse e-mail",
    });
  }

  const created = await createUserRecord(parsed.data);
  const user = toPublicUser(created);
  const token = signToken(created);

  const clientOrigin = config.clientOrigin === "*"
    ? (req.headers.origin || "http://localhost:5173")
    : config.clientOrigin;

  await sendConfirmationEmail({
    prenom: created.prenom,
    nom: created.nom,
    email: created.email,
    confirmationToken: created.confirmationToken,
    clientOrigin,
  });

  await sendWelcomeEmail({
    prenom: created.prenom,
    nom: created.nom,
    email: created.email,
  });

  return res.status(201).json({
    success: true,
    token,
    user,
    message: "Un email de confirmation vous a été envoyé",
  });
});

router.post("/confirmer-email", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token de confirmation requis",
    });
  }

  const confirmed = await confirmUserEmail(token);
  if (!confirmed) {
    return res.status(400).json({
      success: false,
      message: "Token invalide ou expiré",
    });
  }

  return res.json({
    success: true,
    message: "Email confirmé avec succès",
    user: toPublicUser(confirmed),
  });
});

router.post("/connexion", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données de connexion invalides",
      errors: validationErrors(parsed.error),
    });
  }

  const user = await getUserRecordByEmail(parsed.data.email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Email ou mot de passe incorrect",
    });
  }

  if (!comparePassword(parsed.data.password, user.passwordHash)) {
    return res.status(401).json({
      success: false,
      message: "Email ou mot de passe incorrect",
    });
  }

  return res.json({
    success: true,
    token: signToken(user),
    user: toPublicUser(user),
  });
});

export default router;
