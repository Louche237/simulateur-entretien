import crypto from "node:crypto";
import { comparePassword, hashPassword } from "../lib/auth.js";
import { initialsFromUser, makeId } from "../lib/text.js";
import { User, Session } from "../models/index.js";

export const toPublicUser = (rawUser) => {
  if (!rawUser) return null;

  const user = typeof rawUser.get === "function" ? rawUser.get({ plain: true }) : { ...rawUser };
  delete user.passwordHash;
  delete user.confirmationToken;

  return {
    ...user,
    initiales: user.initiales || initialsFromUser(user),
  };
};

export const getUserRecordByEmail = async (email) => {
  if (!email) return null;
  return await User.findOne({
    where: { email: String(email).trim().toLowerCase() },
  });
};

export const getUserRecordById = async (userId) => {
  if (!userId) return null;
  return await User.findByPk(userId);
};

export const listAllUsers = async () => {
  return await User.findAll({
    order: [["createdAt", "DESC"]],
  });
};

export const createUserRecord = async ({ prenom, nom, email, password, role }) => {
  const confirmationToken = crypto.randomBytes(32).toString("hex");
  const confirmationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const totalUsers = await User.count();
  const assignedRole = role || (totalUsers === 0 ? "admin" : "user");

  const created = await User.create({
    id: makeId("usr"),
    prenom: String(prenom || "").trim(),
    nom: String(nom || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    passwordHash: hashPassword(String(password || "")),
    langue: "fr",
    role: assignedRole,
    emailConfirmed: assignedRole === "admin", // auto-confirm admin
    confirmationToken,
    confirmationTokenExpiresAt,
    onboardingCompleted: false,
  });

  return created;
};

export const confirmUserEmail = async (token) => {
  if (!token) return null;
  const user = await User.findOne({ where: { confirmationToken: token } });
  if (!user) return null;

  const now = new Date();
  if (user.confirmationTokenExpiresAt && now > new Date(user.confirmationTokenExpiresAt)) {
    return null;
  }

  await user.update({
    emailConfirmed: true,
    confirmationToken: null,
    confirmationTokenExpiresAt: null,
  });

  return user;
};

export const markOnboardingCompleted = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  await user.update({ onboardingCompleted: true });
  return user;
};

export const updateUserRecord = async (userId, patch = {}) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const updates = {};
  if (patch.prenom !== undefined) updates.prenom = String(patch.prenom).trim();
  if (patch.nom !== undefined) updates.nom = String(patch.nom).trim();
  if (patch.langue !== undefined) updates.langue = String(patch.langue).trim() || "fr";
  if (patch.email !== undefined) updates.email = String(patch.email).trim().toLowerCase();
  if (patch.role !== undefined && ["user", "admin"].includes(patch.role)) updates.role = patch.role;
  if (patch.emailConfirmed !== undefined) updates.emailConfirmed = Boolean(patch.emailConfirmed);
  if (patch.password) updates.passwordHash = hashPassword(String(patch.password));

  await user.update(updates);
  return user;
};

export const updatePasswordRecord = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) return { ok: false, message: "Utilisateur introuvable" };

  if (!comparePassword(currentPassword, user.passwordHash)) {
    return { ok: false, message: "Mot de passe actuel incorrect" };
  }

  await user.update({
    passwordHash: hashPassword(newPassword),
  });

  return { ok: true };
};

export const deleteUserRecord = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return false;

  await user.destroy();
  return true;
};
