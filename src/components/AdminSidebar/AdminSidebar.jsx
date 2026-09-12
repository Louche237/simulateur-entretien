import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Video,
  HelpCircle,
  Database,
  Settings,
  ShieldCheck,
  ExternalLink,
  LogOut,
} from "lucide-react";
import styles from "./AdminSidebar.module.css";

export const ADMIN_TABS = {
  OVERVIEW: "overview",
  USERS: "users",
  SESSIONS: "sessions",
  QUESTIONS: "questions",
  DATABASE: "database",
  SETTINGS: "settings",
};

export default function AdminSidebar({
  activeTab,
  onTabChange,
  counts = {},
}) {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const initials = [currentUser?.prenom, currentUser?.nom]
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "AD";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/admin/login";
  };

  const navItems = [
    {
      key: ADMIN_TABS.OVERVIEW,
      label: "Vue d'ensemble",
      Icon: LayoutDashboard,
      color: "#4f46e5",
    },
    {
      key: ADMIN_TABS.USERS,
      label: "Gérer les utilisateurs",
      Icon: Users,
      color: "#2563eb",
      count: counts.users,
    },
    {
      key: ADMIN_TABS.SESSIONS,
      label: "Consulter les sessions",
      Icon: Video,
      color: "#0284c7",
      count: counts.sessions,
    },
    {
      key: ADMIN_TABS.QUESTIONS,
      label: "Banque de questions",
      Icon: HelpCircle,
      color: "#7c3aed",
      count: counts.questions,
    },
    {
      key: ADMIN_TABS.DATABASE,
      label: "Base de données MySQL",
      Icon: Database,
      color: "#059669",
      isDb: true,
    },
    {
      key: ADMIN_TABS.SETTINGS,
      label: "Paramètres",
      Icon: Settings,
      color: "#64748b",
    },
  ];

  return (
    <aside className={styles.adminSidebar}>
      <div className={styles.brand}>
        <img src="/logo/icon-192.png" alt="logo" className={styles.logoImg} />
        <div className={styles.brandText}>
          <span className={styles.brandName}>JobMentor</span>
          <span className={styles.adminBadge}>
            <ShieldCheck size={12} strokeWidth={2.5} />
            Admin Console
          </span>
        </div>
      </div>

      <div className={styles.sectionLabel}>Navigation Administration</div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          const { Icon } = item;
          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.navItem} ${isActive ? styles.navActive : ""}`}
              onClick={() => onTabChange(item.key)}
            >
              <div className={styles.navItemLeft}>
                <span
                  className={styles.navIcon}
                  style={!isActive ? { color: item.color } : { color: "#ffffff" }}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count !== null && (
                <span className={styles.navCount}>{item.count}</span>
              )}
              {item.isDb && <span className={styles.dbDot} title="MySQL Connecté" />}
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>
              {currentUser.prenom} {currentUser.nom || ""}
            </div>
            <div className={styles.userRole}>Administrateur</div>
          </div>
        </div>

        <div className={styles.footerActions}>
          <Link to="/dashboard" className={styles.switchSpaceBtn}>
            <ExternalLink size={14} strokeWidth={2} />
            <span>Espace Candidat</span>
          </Link>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} strokeWidth={2} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
