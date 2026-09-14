import express from "express";
import { z } from "zod";
import { comparePassword, signToken } from "../lib/auth.js";
import { sendConfirmationEmail, sendWelcomeEmail } from "../lib/email.js";
import { config } from "../config.js";
import {
  confirmUserEmail,
  createUserRecord,
  getUserRecordByEmail,
  regenerateConfirmationToken,
  toPublicUser,
} from "../services/users.js";

const router = express.Router();
const resendCooldown = new Map();

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

  const confirmationToken = created.confirmationToken;

  // Envoi automatique de l'e-mail de confirmation
  const emailResult = await sendConfirmationEmail({
    prenom: created.prenom,
    nom: created.nom,
    email: created.email,
    confirmationToken,
    clientOrigin,
  });

  return res.status(201).json({
    success: true,
    token,
    user,
    emailSent: Boolean(emailResult?.success),
    message: "Inscription réussie ! Un e-mail de confirmation vous a été envoyé.",
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

  const result = await confirmUserEmail(token);

  if (result.status === "invalid" || result.status === "not_found") {
    return res.status(400).json({
      success: false,
      status: "not_found",
      message: "Ce lien de confirmation est invalide ou a déjà été utilisé.",
    });
  }

  if (result.status === "already_confirmed") {
    const user = result.user;
    return res.json({
      success: true,
      alreadyConfirmed: true,
      message: "Votre adresse e-mail est déjà confirmée !",
      token: signToken(user),
      user: toPublicUser(user),
    });
  }

  if (result.status === "expired") {
    return res.status(400).json({
      success: false,
      status: "expired",
      message: "Ce lien de confirmation a expiré (validité 24h). Veuillez demander un nouveau lien.",
      email: result.user?.email,
    });
  }

  const user = result.user;

  // Expédier l'e-mail de bienvenue après confirmation effective
  sendWelcomeEmail({
    prenom: user.prenom,
    nom: user.nom,
    email: user.email,
  }).catch((err) => console.error("[EMAIL] Erreur bienvenue :", err.message));

  return res.json({
    success: true,
    message: "Email confirmé avec succès ! Votre compte est pleinement activé.",
    token: signToken(user),
    user: toPublicUser(user),
  });
});

router.post("/renvoyer-confirmation", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Adresse e-mail valide requise",
    });
  }

  // Cooldown de 60 secondes pour éviter le spam
  const now = Date.now();
  const lastSent = resendCooldown.get(email);
  if (lastSent && now - lastSent < 60000) {
    const remainingSec = Math.ceil((60000 - (now - lastSent)) / 1000);
    return res.status(429).json({
      success: false,
      message: `Veuillez patienter ${remainingSec}s avant de renvoyer un nouvel e-mail.`,
      remainingSec,
    });
  }

  const result = await regenerateConfirmationToken(email);

  if (result.status === "not_found") {
    return res.json({
      success: true,
      message: "Si un compte non confirmé existe pour cet e-mail, un nouveau lien a été envoyé.",
    });
  }

  if (result.status === "already_confirmed") {
    return res.json({
      success: true,
      alreadyConfirmed: true,
      message: "Votre adresse e-mail est déjà confirmée. Vous pouvez vous connecter directement.",
    });
  }

  const clientOrigin = config.clientOrigin === "*"
    ? (req.headers.origin || "http://localhost:5173")
    : config.clientOrigin;

  const emailResult = await sendConfirmationEmail({
    prenom: result.user.prenom,
    nom: result.user.nom,
    email: result.user.email,
    confirmationToken: result.confirmationToken,
    clientOrigin,
  });

  resendCooldown.set(email, now);

  return res.json({
    success: true,
    emailSent: Boolean(emailResult?.success),
    message: "Un nouvel e-mail de confirmation vous a été envoyé.",
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
