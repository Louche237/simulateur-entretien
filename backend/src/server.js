import app from "./app.js";
import { config } from "./config.js";
import { initializeDatabase } from "./db/initDb.js";
import { ensureDb } from "./store.js";
import { verifyEmailTransporter } from "./lib/email.js";

// Maintenir ensureDb() pour la compatibilité
ensureDb();

// Initialiser la base de données MySQL avec Sequelize
initializeDatabase({ seed: true, migrate: true })
  .then((res) => {
    if (res.ok) {
      console.log("🚀 Base de données MySQL prête et synchronisée avec Sequelize !");
    } else {
      console.warn("⚠️ MySQL non disponible au démarrage :", res.error);
      console.warn("💡 Assurez-vous que le serveur MySQL est démarré et configurez vos identifiants dans .env.local.");
    }
  })
  .catch((err) => {
    console.warn("⚠️ Avertissement lors de la connexion MySQL :", err.message);
  });

app.listen(config.port, () => {
  console.log(`Backend JobMentor prêt sur http://localhost:${config.port}`);
  verifyEmailTransporter().catch(() => {});
});
