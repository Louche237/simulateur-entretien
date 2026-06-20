import fs from "node:fs";
import path from "node:path";
import { DEFAULT_QUESTION_BANK } from "./constants.js";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "db.json");

const createInitialDb = () => ({
  users: [],
  sessions: [],
  questionBank: DEFAULT_QUESTION_BANK,
  meta: {
    version: 1,
    createdAt: new Date().toISOString(),
  },
});

export const ensureDb = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(createInitialDb(), null, 2));
  }
};

export const readDb = () => {
  ensureDb();
  const raw = fs.readFileSync(dataFile, "utf8");
  return JSON.parse(raw);
};

export const writeDb = (db) => {
  ensureDb();
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
  return db;
};

export const updateDb = (mutator) => {
  const db = readDb();
  const next = mutator(db) || db;
  return writeDb(next);
};
