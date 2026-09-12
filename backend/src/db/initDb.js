import fs from "node:fs";
import path from "node:path";
import { DEFAULT_QUESTION_BANK } from "../constants.js";
import { ensureDatabaseExists, sequelize, testDbConnection } from "./sequelize.js";
import { User, Session, QuestionBank, SystemSetting } from "../models/index.js";
import { hashPassword } from "../lib/auth.js";
import { makeId } from "../lib/text.js";

const dataDir = path.resolve(process.cwd(), "data");
const dbJsonPath = path.join(dataDir, "db.json");

export const initializeDatabase = async ({ seed = true, migrate = true } = {}) => {
  console.log("🔄 Initialisation de la base de données MySQL...");

  // 1. Test direct de connexion à la base de données
  let connResult = await testDbConnection();

  if (!connResult.connected) {
    // Si la base n'existe pas encore ou n'est pas accessible, on tente de la créer
    const dbCreateResult = await ensureDatabaseExists();
    if (dbCreateResult.ok) {
      connResult = await testDbConnection();
    }
  }

  if (!connResult.connected) {
    console.error("❌ Impossible de se connecter à MySQL :", connResult.error);
    return { ok: false, error: connResult.error };
  }
  console.log(`✅ Connecté à MySQL [${connResult.database}] sur ${connResult.host}:${connResult.port}`);

  // 3. Synchronisation des modèles (tables)
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronisées avec succès via Sequelize (users, sessions, question_banks, system_settings).");
  } catch (syncError) {
    console.error("❌ Erreur lors de sequelize.sync :", syncError.message);
    return { ok: false, error: syncError.message };
  }

  // 4. Migration depuis db.json si disponible et tables vides
  if (migrate && fs.existsSync(dbJsonPath)) {
    try {
      const raw = fs.readFileSync(dbJsonPath, "utf8");
      const jsonData = JSON.parse(raw);

      const userCount = await User.count();
      if (userCount === 0 && Array.isArray(jsonData.users) && jsonData.users.length > 0) {
        console.log(`📦 Migration de ${jsonData.users.length} utilisateur(s) depuis db.json vers MySQL...`);
        for (const u of jsonData.users) {
          await User.upsert({
            id: u.id || makeId("usr"),
            prenom: u.prenom || "",
            nom: u.nom || "",
            email: (u.email || "").toLowerCase(),
            passwordHash: u.passwordHash,
            langue: u.langue || "fr",
            role: u.role || "user",
            emailConfirmed: Boolean(u.emailConfirmed),
            confirmationToken: u.confirmationToken || null,
            confirmationTokenExpiresAt: u.confirmationTokenExpiresAt ? new Date(u.confirmationTokenExpiresAt) : null,
            onboardingCompleted: Boolean(u.onboardingCompleted),
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
            updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
          });
        }
      }

      const sessionCount = await Session.count();
      if (sessionCount === 0 && Array.isArray(jsonData.sessions) && jsonData.sessions.length > 0) {
        console.log(`📦 Migration de ${jsonData.sessions.length} session(s) depuis db.json vers MySQL...`);
        for (const s of jsonData.sessions) {
          // Vérifier que le userId existe
          const userExists = await User.findByPk(s.userId);
          if (userExists) {
            await Session.upsert({
              id: s.id || makeId("ses"),
              userId: s.userId,
              source: s.source || "local",
              status: s.status || "en_cours",
              poste: s.poste || "",
              entreprise: s.entreprise || "",
              niveau: s.niveau || "debutant",
              difficulte: s.difficulte || "facile",
              recruteur: s.recruteur || "aria",
              surprises: Boolean(s.surprises),
              duree: s.duree || 10,
              langue: s.langue || "fr",
              description: s.description || null,
              cvName: s.cvName || null,
              type: s.type || "rh",
              questions: s.questions || [],
              score: s.score ?? null,
              feedback: s.feedback || null,
              review: s.review || null,
              finishedAt: s.finishedAt ? new Date(s.finishedAt) : null,
              createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
              updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
            });
          }
        }
      }
    } catch (migErr) {
      console.warn("⚠️ Attention lors de la lecture de db.json :", migErr.message);
    }
  }

  // 5. Seeder la banque de questions si vide
  if (seed) {
    const qCount = await QuestionBank.count();
    if (qCount === 0) {
      console.log("🌱 Injection des questions initiales dans la base MySQL...");
      for (const q of DEFAULT_QUESTION_BANK) {
        await QuestionBank.create({
          id: q.id || makeId("qbk"),
          category: q.category || "general",
          text: q.text,
          focus: q.focus || null,
          followUp: q.followUp || null,
          isActive: true,
        });
      }
      console.log(`✅ ${DEFAULT_QUESTION_BANK.length} questions injectées.`);
    }

    // 6. S'assurer qu'un compte administrateur existe
    const adminCount = await User.count({ where: { role: "admin" } });
    if (adminCount === 0) {
      const defaultAdminEmail = "admin@jobmentor.fr";
      const existingUser = await User.findOne({ where: { email: defaultAdminEmail } });
      if (!existingUser) {
        console.log("🛡️ Création du compte administrateur initial par défaut...");
        await User.create({
          id: makeId("usr"),
          prenom: "Admin",
          nom: "JobMentor",
          email: defaultAdminEmail,
          passwordHash: hashPassword("Admin2026!"),
          role: "admin",
          emailConfirmed: true,
          langue: "fr",
          onboardingCompleted: true,
        });
        console.log(`✅ Compte Administrateur créé : ${defaultAdminEmail} (mot de passe : Admin2026!)`);
      } else {
        await existingUser.update({ role: "admin" });
        console.log(`✅ Rôle administrateur attribué à ${defaultAdminEmail}.`);
      }
    }
  }

  console.log("🎉 Initialisation complète de la base de données MySQL terminée !");
  return { ok: true };
};

// Si exécuté directement en CLI : node src/db/initDb.js
if (process.argv[1] && process.argv[1].endsWith("initDb.js")) {
  initializeDatabase()
    .then((res) => {
      if (!res.ok) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erreur fatale :", err);
      process.exit(1);
    });
}
