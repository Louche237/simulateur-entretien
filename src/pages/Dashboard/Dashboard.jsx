import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { sessionAPI, userAPI } from "../../utils/api";
import { getLocalSessions, getLocalStats } from "../../utils/localSessions";
import styles from "./Dashboard.module.css";

/* ── ICÔNES SVG PROFESSIONNELLES ── */
const Icon = {
  // Micro (sessions)
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  ),
  // Tendance (score)
  trend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  // Chrono (temps)
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  ),
  // Médaille (badges)
  badge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5" />
      <path d="M7.21 15.89L5 22l7-2 7 2-2.21-6.11" />
    </svg>
  ),
  // Calendrier
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
      <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
      <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
    </svg>
  ),
  // Graphique barres
  bars: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="6" width="4" height="15" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  ),
  // Étoile (premium)
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  // Play
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  // Flèche droite
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  // Bouclier (objectif)
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  // Trophée (badge individuel)
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M6 9a6 6 0 0 0 12 0" />
      <path d="M12 15v4" />
      <path d="M8 19h8" />
    </svg>
  ),
  // Éclair (semaine productive)
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  // Podium (score excellent)
  podium: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="14" width="5" height="7" rx="1" />
      <rect x="9.5" y="10" width="5" height="11" rx="1" />
      <rect x="17" y="17" width="5" height="4" rx="1" />
      <polyline points="4.5 11 12 4 19.5 14" />
    </svg>
  ),
  // Boucle (régularité)
  loop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
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

const BADGES = [
  { label: "Premier entretien", icon: "trophy", color: "indigo" },
  { label: "Semaine productive", icon: "bolt", color: "violet" },
  { label: "Score excellent", icon: "podium", color: "blue" },
  { label: "Régularité", icon: "loop", color: "teal" },
];

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
    {
      label: "Sessions totales",
      value: String(stats.totalSessions),
      icon: "mic",
      colorClass: "icBlue",
      trend: "+2 ce mois",
    },
    {
      label: "Score moyen",
      value: `${stats.scoreMoyen}%`,
      icon: "trend",
      colorClass: "icIndigo",
      trend: stats.scoreMoyen >= 70 ? "Bon niveau" : "En progression",
    },
    {
      label: "Temps total",
      value: `${stats.tempsTotal}m`,
      icon: "clock",
      colorClass: "icViolet",
      trend: "Cumulé",
    },
    {
      label: "Badges obtenus",
      value: `${stats.badges}/4`,
      icon: "badge",
      colorClass: "icAmber",
      trend: `${4 - stats.badges} restants`,
    },
  ];

  return (
    <div className={styles.layout}>
      <Sidebar user={user} />

      <div className={styles.main}>
        {/* ── Topbar ── */}
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>Tableau de bord</h1>
            <p className={styles.pageSub}>Bienvenue, <strong>{prenom}</strong> 👋</p>
          </div>
          <div className={styles.topbarActions}>
            <button className={styles.btnPremium}>
              <span className={styles.btnIcon}>{Icon.star}</span>
              Passer Premium
            </button>
            <button className={styles.btnStart} onClick={() => navigate("/simulation")}>
              <span className={styles.btnIcon}>{Icon.play}</span>
              Démarrer un entretien
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {/* ── Stat Cards ── */}
          <div className={styles.statsRow}>
            {statCards.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={`${styles.statIconBox} ${styles[s.colorClass]}`}>
                  {Icon[s.icon]}
                </div>
                <div className={styles.statBody}>
                  <div className={styles.statLabel}>{s.label}</div>
                  <div className={styles.statValue}>{s.value}</div>
                  <div className={styles.statTrend}>{s.trend}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Centre ── */}
          <div className={styles.centerCol}>
            {/* Hero Card */}
            <div className={styles.heroCard}>
              <div className={styles.heroContent}>
                <div className={styles.heroBadge}>
                  <span className={styles.heroBadgeIcon}>{Icon.mic}</span>
                  IA · Temps réel
                </div>
                <h2>Simulez un entretien professionnel</h2>
                <p>
                  Notre coach IA s'adapte à votre profil et vous donne un feedback
                  instantané sur chaque réponse. Préparez-vous comme un pro.
                </p>
                <button className={styles.btnHero} onClick={() => navigate("/simulation")}>
                  {Icon.play}
                  <span>Démarrer maintenant</span>
                  <span className={styles.btnArrow}>{Icon.arrow}</span>
                </button>
              </div>
              <div className={styles.heroVisual} aria-hidden="true">
                <div className={styles.heroOrb} />
                <div className={styles.heroRing} />
              </div>
            </div>

            {/* Sessions récentes */}
            <div className={styles.sessionsCard}>
              <div className={styles.sessionsHead}>
                <h3>
                  <span className={styles.sessionsHeadIcon}>{Icon.bars}</span>
                  Sessions récentes
                </h3>
                <button className={styles.voirTout} onClick={() => navigate("/historique")}>
                  Voir tout {Icon.arrow}
                </button>
              </div>
              {sessions.length === 0 ? (
                <div className={styles.sessionsEmpty}>
                  <div className={styles.emptyIcon}>{Icon.mic}</div>
                  <p>Aucun entretien réalisé</p>
                  <span>Commencez votre première simulation ci-dessus.</span>
                </div>
              ) : (
                <div className={styles.dashboardSessionsList}>
                  {sessions.map((session) => (
                    <div key={session.id || session._id} className={styles.dashboardSessionItem}>
                      <div className={styles.sessionItemIcon}>{Icon.mic}</div>
                      <div className={styles.sessionItemBody}>
                        <strong>{session.poste || "Entretien"}</strong>
                        <span>{session.entreprise || "Entreprise non renseignée"}</span>
                      </div>
                      <div className={
                        session.status === "terminee"
                          ? styles.sessionScore
                          : styles.sessionOngoing
                      }>
                        {session.status === "terminee" ? `${session.score}%` : "En cours"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Droite ── */}
          <div className={styles.rightCol}>
            {/* Progression */}
            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>
                <span className={styles.panelIcon + " " + styles.iconIndigo}>{Icon.target}</span>
                Progression
              </div>
              <div className={styles.progRow}>
                <span>Objectif mensuel</span>
                <span>{stats.totalSessions}/{stats.objectifMensuel}</span>
              </div>
              <div className={styles.progBar}>
                <div className={styles.progFill} style={{ width: `${objectifPct}%` }} />
              </div>
              <div className={styles.progRow}>
                <span>Score cible</span>
                <span>{stats.scoreMoyen}/{stats.scoreCible}</span>
              </div>
              <div className={styles.progBar}>
                <div className={`${styles.progFill} ${styles.progFillGreen}`} style={{ width: `${scorePct}%` }} />
              </div>
            </div>

            {/* Badges */}
            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>
                <span className={styles.panelIcon + " " + styles.iconAmber}>{Icon.badge}</span>
                Badges
              </div>
              <div className={styles.badgesGrid}>
                {BADGES.map((b) => (
                  <div key={b.label} className={`${styles.badgeItem} ${styles["badge_" + b.color]}`}>
                    <span className={styles.badgeItemIcon}>{Icon[b.icon]}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prochaine session */}
            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>
                <span className={styles.panelIcon + " " + styles.iconBlue}>{Icon.calendar}</span>
                Prochaine session
              </div>
              <p className={styles.nextSub}>Entretien recommandé</p>
              <div className={styles.nextCard}>
                <div className={styles.nextCardIcon}>{Icon.mic}</div>
                <div>
                  <strong>Entretien RH</strong>
                  <span>Environ 15 min · Niveau débutant</span>
                </div>
              </div>
              <button className={styles.btnNext} onClick={() => navigate("/simulation")}>
                <span>{Icon.play}</span>
                Commencer maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
