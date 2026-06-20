import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { sessionAPI, userAPI } from "../../utils/api";
import { getLocalSessions, getLocalStats } from "../../utils/localSessions";
import styles from "./Dashboard.module.css";

const ICONS = {
  mic: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  play: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  trend: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  badge: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  calendar: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  bars: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  star: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  clock: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const emptyStats = {
  totalSessions: 0,
  scoreMoyen: 0,
  tempsTotal: 0,
  badges: 0,
  objectifMensuel: 20,
  scoreCible: 85,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [stats, setStats] = useState(() => ({ ...emptyStats, ...getLocalStats() }));
  const [sessions, setSessions] = useState(() => getLocalSessions().slice(0, 3));

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [profilRes, statsRes, sessionsRes] = await Promise.all([
        userAPI.getProfil(),
        userAPI.getStats(),
        sessionAPI.getToutes("?limit=3"),
      ]);

      if (!mounted) return;

      if (profilRes.success && profilRes.user) {
        setUser(profilRes.user);
        localStorage.setItem("user", JSON.stringify(profilRes.user));
      }

      if (statsRes.success) {
        setStats((current) => ({ ...current, ...statsRes.stats }));
      } else {
        setStats((current) => ({ ...current, ...getLocalStats() }));
      }

      if (sessionsRes.success) {
        setSessions(sessionsRes.sessions || []);
      } else {
        setSessions(getLocalSessions().slice(0, 3));
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const prenom = user?.prenom || user?.firstName || user?.nom || "utilisateur";
  const objectifPct = Math.min(100, Math.round((stats.totalSessions / stats.objectifMensuel) * 100));
  const scorePct = Math.min(100, Math.round((stats.scoreMoyen / stats.scoreCible) * 100));

  const statCards = [
    { label: "Sessions totales", value: String(stats.totalSessions), ic: "mic", color: "purple" },
    { label: "Score moyen", value: `${stats.scoreMoyen}%`, ic: "trend", color: "gray" },
    { label: "Temps total", value: `${stats.tempsTotal}m`, ic: "clock", color: "purple" },
    { label: "Badges", value: `${stats.badges}/4`, ic: "badge", color: "orange" },
  ];

  return (
    <div className={styles.layout}>
      <Sidebar user={user} />

      <div className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>Tableau de bord</h1>
            <p className={styles.pageSub}>Bienvenue {prenom}</p>
          </div>
          <div className={styles.topbarActions}>
            <button className={styles.btnPremium}>{ICONS.star} Passer Premium</button>
            <button className={styles.btnStart} onClick={() => navigate("/simulation")}>
              {ICONS.play} Démarrer un entretien
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.statsRow}>
            {statCards.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>{s.label}</div>
                  <div className={styles.statValue}>{s.value}</div>
                </div>
                <div className={`${styles.statIc} ${styles["ic_" + s.color]}`}>
                  {ICONS[s.ic]}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.centerCol}>
            <div className={styles.heroCard}>
              <h2>Commencez votre première simulation</h2>
              <p>Préparez-vous efficacement en simulant un véritable entretien. L'IA s'adapte à votre profil et vous donne un feedback instantané.</p>
              <button className={styles.btnHero} onClick={() => navigate("/simulation")}>
                {ICONS.play} Démarrer maintenant
              </button>
            </div>

            <div className={styles.sessionsCard}>
              <div className={styles.sessionsHead}>
                <h3>{ICONS.bars} Sessions récentes</h3>
                <button className={styles.voirTout} onClick={() => navigate("/historique")}>Voir tout</button>
              </div>
              {sessions.length === 0 ? (
                <div className={styles.sessionsEmpty}>
                  {ICONS.mic}
                  <p>Aucun entretien réalisé</p>
                  <span>Commencez votre première simulation.</span>
                </div>
              ) : (
                <div className={styles.dashboardSessionsList}>
                  {sessions.map((session) => (
                    <div key={session.id || session._id} className={styles.dashboardSessionItem}>
                      <div>
                        <strong>{session.poste || "Entretien"}</strong>
                        <span>{session.entreprise || "Entreprise non renseignée"}</span>
                      </div>
                      <small>{session.status === "terminee" ? `${session.score}%` : "En cours"}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>{ICONS.trend} Progression</div>
              <div className={styles.progRow}><span>Objectif mensuel</span><span>{stats.totalSessions}/{stats.objectifMensuel}</span></div>
              <div className={styles.progBar}><div className={styles.progFill} style={{ width: `${objectifPct}%` }} /></div>
              <div className={styles.progRow}><span>Score moyen cible</span><span>{stats.scoreMoyen}/{stats.scoreCible}</span></div>
              <div className={styles.progBar}><div className={styles.progFill} style={{ width: `${scorePct}%` }} /></div>
            </div>

            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>{ICONS.badge} Badges</div>
              <div className={styles.badgesGrid}>
                {["Premier entretien", "Semaine productive", "Score excellent", "Régularité"].map((b) => (
                  <div key={b} className={styles.badgeItem}>
                    {ICONS.badge}
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>{ICONS.calendar} Prochaine session</div>
              <p className={styles.nextSub}>Commencez votre première simulation</p>
              <div className={styles.nextCard}>
                <strong>Premier entretien</strong>
                <span>Entretien RH recommandé - environ 15 min</span>
              </div>
              <button className={styles.btnNext} onClick={() => navigate("/simulation")}>
                {ICONS.play} Commencer maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
