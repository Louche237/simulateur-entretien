import { useState, useEffect } from "react";
import {
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Users,
  Video,
  HelpCircle,
  Zap,
  RotateCcw,
  Terminal,
} from "lucide-react";
import styles from "./Admin.module.css";
import { adminAPI } from "../../utils/api";

export default function AdminDatabase() {
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDbStatus();
      if (res.success) {
        setDbStatus(res.db);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    try {
      setActionLoading(true);
      setActionMessage("");
      const res = await adminAPI.syncDb();
      setActionMessage(res.message || "Synchronisation terminée.");
      await fetchStatus();
    } catch (err) {
      setActionMessage("Erreur lors de la synchronisation : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInit = async () => {
    if (!window.confirm("Voulez-vous réexécuter l'initialisation et la synchronisation de la base MySQL ?")) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");
      const res = await adminAPI.initDb();
      setActionMessage(res.message || "Initialisation effectuée.");
      await fetchStatus();
    } catch (err) {
      setActionMessage("Erreur : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionDesc}>
            Supervisez la connexion ORM Sequelize et l'état des tables MySQL de la plateforme.
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchStatus} disabled={loading || actionLoading}>
          <RefreshCw size={15} strokeWidth={2} />
          <span>Actualiser</span>
        </button>
      </div>

      {actionMessage && (
        <div className={styles.infoBanner}>
          <Info size={18} strokeWidth={2} className={styles.infoBannerIcon} />
          <span>{actionMessage}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Vérification de la base de données...</div>
      ) : (
        <>
          <div className={styles.dbStatusCard}>
            <div className={styles.dbStatusHeader}>
              <div className={styles.dbIndicator}>
                {dbStatus?.connected ? (
                  <CheckCircle2 size={20} strokeWidth={2} color="#16a34a" />
                ) : (
                  <AlertTriangle size={20} strokeWidth={2} color="#ef4444" />
                )}
                <h3>
                  {dbStatus?.connected
                    ? "Connexion MySQL Active & Opérationnelle"
                    : "MySQL Déconnecté ou En Attente"}
                </h3>
              </div>
              <span className={styles.dialectBadge}>Dialecte : {dbStatus?.dialect?.toUpperCase() || "MYSQL"}</span>
            </div>

            <div className={styles.dbInfoGrid}>
              <div className={styles.dbInfoItem}>
                <span className={styles.dbInfoLabel}>Hôte :</span>
                <span className={styles.dbInfoVal}>{dbStatus?.host || "127.0.0.1"}</span>
              </div>
              <div className={styles.dbInfoItem}>
                <span className={styles.dbInfoLabel}>Port :</span>
                <span className={styles.dbInfoVal}>{dbStatus?.port || 3306}</span>
              </div>
              <div className={styles.dbInfoItem}>
                <span className={styles.dbInfoLabel}>Nom de la base :</span>
                <span className={styles.dbInfoVal}>{dbStatus?.database || "jobmentor_db"}</span>
              </div>
              <div className={styles.dbInfoItem}>
                <span className={styles.dbInfoLabel}>État ORM :</span>
                <span className={styles.dbInfoVal}>
                  {dbStatus?.connected ? "Synchronisé (Sequelize)" : "Non joignable"}
                </span>
              </div>
            </div>

            {dbStatus?.error && (
              <div className={styles.dbErrorAlert}>
                <strong>Détail de l'erreur :</strong> {dbStatus.error}
              </div>
            )}
          </div>

          <div className={styles.statsGrid} style={{ marginTop: "1.5rem" }}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconUsers}`}>
                <Users size={22} strokeWidth={2} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{dbStatus?.counts?.users ?? 0}</div>
                <div className={styles.statLabel}>Table `users`</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconSessions}`}>
                <Video size={22} strokeWidth={2} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{dbStatus?.counts?.sessions ?? 0}</div>
                <div className={styles.statLabel}>Table `sessions`</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconQuestions}`}>
                <HelpCircle size={22} strokeWidth={2} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{dbStatus?.counts?.questions ?? 0}</div>
                <div className={styles.statLabel}>Table `question_banks`</div>
              </div>
            </div>
          </div>

          <div className={styles.actionPanelCard}>
            <h3>Outils d'Administration & Maintenance</h3>
            <p>
              Exécutez des opérations directes sur la base de données sans redémarrer le serveur.
            </p>
            <div className={styles.dbActionsRow}>
              <button
                className={styles.primaryBtn}
                onClick={handleSync}
                disabled={actionLoading}
              >
                <Zap size={15} strokeWidth={2} />
                <span>{actionLoading ? "Exécution..." : "Synchroniser les tables (Sequelize Alter)"}</span>
              </button>
              <button
                className={styles.secondaryBtn}
                onClick={handleInit}
                disabled={actionLoading}
              >
                <RotateCcw size={15} strokeWidth={2} />
                <span>Ré-initialiser & Seeder les tables</span>
              </button>
            </div>
          </div>

          <div className={styles.configInstructions}>
            <h4>
              <Terminal size={17} strokeWidth={2} />
              <span>Configuration de l'environnement MySQL</span>
            </h4>
            <p>
              Les paramètres de connexion sont définis dans votre fichier <code>backend/.env.local</code> :
            </p>
            <pre className={styles.codeBlock}>
              {`DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=jobmentor_db
DB_USER=root
DB_PASSWORD=
ADMIN_INVITE_CODE=ADMIN2026`}
            </pre>
            <p>
              Vous pouvez également exécuter en ligne de commande : <code>npm run db:init</code> pour initialiser la base MySQL manuellement.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
