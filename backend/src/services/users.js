import { comparePassword, hashPassword } from "../lib/auth.js";
import { initialsFromUser, makeId } from "../lib/text.js";
import { readDb, updateDb } from "../store.js";

export const toPublicUser = (user) => {
  if (!user) return null;

  const publicUser = { ...user };
  delete publicUser.passwordHash;
  return {
    ...publicUser,
    initiales: publicUser.initiales || initialsFromUser(publicUser),
  };
};

export const getUserRecordByEmail = (email) => {
  const db = readDb();
  return (
    db.users.find(
      (user) => user.email.toLowerCase() === String(email).toLowerCase()
    ) || null
  );
};

export const getUserRecordById = (userId) => {
  const db = readDb();
  return db.users.find((user) => user.id === userId) || null;
};

export const createUserRecord = ({ prenom, nom, email, password }) => {
  let created = null;

  updateDb((db) => {
    const user = {
      id: makeId("usr"),
      prenom: String(prenom || "").trim(),
      nom: String(nom || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      passwordHash: hashPassword(String(password || "")),
      langue: "fr",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.unshift(user);
    created = user;
    return db;
  });

  return created;
};

export const updateUserRecord = (userId, patch = {}) => {
  let updated = null;

  updateDb((db) => {
    const user = db.users.find((entry) => entry.id === userId);
    if (!user) return db;

    if (patch.prenom !== undefined) {
      user.prenom = String(patch.prenom || "").trim();
    }

    if (patch.nom !== undefined) {
      user.nom = String(patch.nom || "").trim();
    }

    if (patch.langue !== undefined) {
      user.langue = String(patch.langue || "fr").trim() || "fr";
    }

    if (patch.email !== undefined) {
      user.email = String(patch.email || "").trim().toLowerCase();
    }

    user.updatedAt = new Date().toISOString();
    updated = user;
    return db;
  });

  return updated;
};

export const updatePasswordRecord = (userId, currentPassword, newPassword) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) return { ok: false, message: "Utilisateur introuvable" };

  if (!comparePassword(currentPassword, user.passwordHash)) {
    return { ok: false, message: "Mot de passe actuel incorrect" };
  }

  updateDb((draft) => {
    const draftUser = draft.users.find((entry) => entry.id === userId);
    if (!draftUser) return draft;
    draftUser.passwordHash = hashPassword(newPassword);
    draftUser.updatedAt = new Date().toISOString();
    return draft;
  });

  return { ok: true };
};

export const deleteUserRecord = (userId) => {
  updateDb((db) => {
    db.users = db.users.filter((user) => user.id !== userId);
    db.sessions = db.sessions.filter((session) => session.userId !== userId);
    return db;
  });
};
