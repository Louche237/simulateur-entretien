import { randomUUID } from "node:crypto";

export const cleanText = (value) =>
  String(value ?? "")
    .replaceAll(String.fromCharCode(0), "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const truncateText = (value, max = 16000) => {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[Texte tronqué]`;
};

export const initialsFromUser = (user) => {
  const prenom = user?.prenom || user?.firstName || "";
  const nom = user?.nom || user?.lastName || "";
  const base = `${prenom} ${nom}`.trim() || user?.email || "Utilisateur";

  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export const makeId = (prefix) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

export const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const toLower = (value) => cleanText(value).toLowerCase();
