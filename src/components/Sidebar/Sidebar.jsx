import { Link, useLocation } from "react-router-dom";
import { getPreferredLanguage, normalizeLanguage, getStoredUser } from "../../utils/preferences";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { key: "dashboard", icon: "grid", path: "/dashboard" },
  { key: "simulation", icon: "mic", path: "/simulation" },
  { key: "entrainements", icon: "clock", path: "/entrainements" },
  { key: "analyseCv", icon: "file", path: "/analyse-cv" },
  { key: "cvBuilder", icon: "layout", path: "/cv-builder" },
  { key: "historique", icon: "history", path: "/historique" },
  { key: "abonnements", icon: "card" },
  { key: "parametres", icon: "settings", path: "/parametres" },
];

const LABELS = {
  fr: {
    dashboard: "Dashboard",
    simulation: "Simulation",
    entrainements: "Entraînements",
    analyseCv: "Analyse CV",
    cvBuilder: "CV Builder",
    historique: "Historique",
    abonnements: "Abonnements",
    parametres: "Paramètres",
    profil: "Profil",
    deconnexion: "Déconnexion",
  },
  en: {
    dashboard: "Dashboard",
    simulation: "Interview",
    entrainements: "Training",
    analyseCv: "CV Analysis",
    cvBuilder: "CV Builder",
    historique: "History",
    abonnements: "Subscriptions",
    parametres: "Settings",
    profil: "Profile",
    deconnexion: "Logout",
  },
};

const ICONS = {
  grid: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  mic: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  clock: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  file: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  layout: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  history: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  card: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  settings: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  user: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const initialsFrom = (user) => {
  const prenom = user?.prenom || user?.firstName || "";
  const nom = user?.nom || user?.lastName || "";
  const base = `${prenom} ${nom}`.trim() || user?.email || "Utilisateur";
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function Sidebar({ user }) {
  const location = useLocation();
  const storedUser = getStoredUser();
  const currentUser = user || storedUser || { nom: "Jean", email: "jean@exemple.com", initiales: "JE" };
  const language = normalizeLanguage(getPreferredLanguage(currentUser?.langue || "fr"));
  const labels = LABELS[language] || LABELS.fr;
  const displayName = [currentUser?.prenom, currentUser?.nom].filter(Boolean).join(" ") || currentUser?.nom || "Utilisateur";
  const displayEmail = currentUser?.email || "email non renseigné";
  const initials = currentUser?.initiales || initialsFrom(currentUser);

  const logout = () => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const userIdent = user.id || user.email;
        if (userIdent) {
          localStorage.removeItem(`jobmentor.activeSessionId_${userIdent}`);
        }
      }
    } catch (e) {}
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <img src="/logo/icon-192.png" alt="logo" className={styles.logoImg} />
        <span className={styles.logoName}>JobMentor</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) =>
          item.path ? (
            <Link
              key={item.key}
              to={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.navActive : ""}`}
            >
              {ICONS[item.icon]}{labels[item.key]}
            </Link>
          ) : (
            <div key={item.key} className={`${styles.navItem} ${styles.navDisabled}`}>
              {ICONS[item.icon]}{labels[item.key]}
            </div>
          )
        )}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userEmail}>{displayEmail}</div>
          </div>
        </div>
        <div className={styles.footerLinks}>
          <Link to="/parametres" className={styles.footerLink}>{ICONS.user} {labels.profil}</Link>
          <Link to="/" className={styles.footerLink} onClick={logout}>{ICONS.logout} {labels.deconnexion}</Link>
        </div>
      </div>
    </aside>
  );
}
