import express from "express";
import { z } from "zod";
import { comparePassword, signToken } from "../lib/auth.js";
import { config } from "../config.js";
import {
  createUserRecord,
  getUserRecordByEmail,
  toPublicUser,
} from "../services/users.js";

const router = express.Router();

const adminLoginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const adminRegisterSchema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis"),
  nom: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  adminKey: z.string().min(1, "Code d'accès administrateur requis"),
});

const validationErrors = (error) =>
  error.issues.map((issue) => ({
    path: issue.path[0] || "general",
    msg: issue.message,
  }));

/**
 * Connexion dédiée Administrateur
 */
router.post("/login", async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
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
      message: "Identifiants administrateur incorrects",
    });
  }

  if (!comparePassword(parsed.data.password, user.passwordHash)) {
    return res.status(401).json({
      success: false,
      message: "Identifiants administrateur incorrects",
    });
  }

  if (user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Accès refusé. Ce compte ne possède pas les privilèges administrateur.",
    });
  }

  return res.json({
    success: true,
    token: signToken(user),
    user: toPublicUser(user),
  });
});

/**
 * Inscription dédiée Administrateur
 */
router.post("/register", async (req, res) => {
  const parsed = adminRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données d'inscription invalides",
      errors: validationErrors(parsed.error),
    });
  }

  // Vérification de la clé secrète administrateur
  if (parsed.data.adminKey !== config.adminInviteCode) {
    return res.status(403).json({
      success: false,
      message: "Clé de sécurité administrateur invalide. Contactez le responsable de l'infrastructure.",
    });
  }

  const existing = await getUserRecordByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Un compte existe déjà avec cette adresse e-mail.",
    });
  }

  const created = await createUserRecord({
    prenom: parsed.data.prenom,
    nom: parsed.data.nom,
    email: parsed.data.email,
    password: parsed.data.password,
    role: "admin",
  });

  const user = toPublicUser(created);
  const token = signToken(created);

  return res.status(201).json({
    success: true,
    token,
    user,
    message: "Compte administrateur créé avec succès !",
  });
});

export default router;
