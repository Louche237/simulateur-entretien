import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { sessionAPI, userAPI } from "../../utils/api";
import { getLocalSessions, getLocalStats, setActiveSessionId, deleteLocalSession } from "../../utils/localSessions";
import styles from "./Historique.module.css";

const ICONS = {
  mic: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  play: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  download: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  search: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  calendar: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  trend: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendUp: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  chevron: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
  clock: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trash: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
};

const emptyStats = {
  totalSessions: 0,
  scoreMoyen: 0,
  tempsTotal: 0,
  meilleurScore: 0,
  amelioration: "N/A",
};

export default function Historique() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous les types");
  const [dateFilter, setDateFilter] = useState("Date (plus récent)");
  const [sessions, setSessions] = useState(() => getLocalSessions());
  const [stats, setStats] = useState(() => ({ ...emptyStats, ...getLocalStats() }));

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [sessionsRes, statsRes] = await Promise.all([
        sessionAPI.getToutes(),
        userAPI.getStats(),
      ]);

      if (!mounted) return;
      if (sessionsRes.success) {
        setSessions(sessionsRes.sessions || []);
      } else {
        setSessions(getLocalSessions());
      }
      if (statsRes.success) {
        setStats((current) => ({ ...current, ...statsRes.stats }));
      } else {
        setStats((current) => ({ ...current, ...getLocalStats() }));
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    
    // 1. Sort the sessions
    const sorted = [...sessions].sort((a, b) => {
      if (dateFilter === "Date (plus récent)") {
        const left = new Date(a.createdAt || 0).getTime();
        const right = new Date(b.createdAt || 0).getTime();
        return right - left;
      }
      if (dateFilter === "Date (plus ancien)") {
        const left = new Date(a.createdAt || 0).getTime();
        const right = new Date(b.createdAt || 0).getTime();
        return left - right;
      }
      if (dateFilter === "score (plus élevé)") {
        const left = a.score ?? -1;
        const right = b.score ?? -1;
        return right - left;
      }
      if (dateFilter === "durée") {
        const left = a.duree ?? 0;
        const right = b.duree ?? 0;
        return right - left;
      }
      if (dateFilter === "type") {
        const leftType = String(a.type || a.source || "").toLowerCase();
        const rightType = String(b.type || b.source || "").toLowerCase();
        return leftType.localeCompare(rightType);
      }
      return 0;
    });

    // 2. Filter the sessions
    return sorted.filter((session) => {
      if (typeFilter !== "Tous les types") {
        const sessionType = String(session.type || (session.source === "local" ? "rh" : session.source) || "").toLowerCase();
        if (typeFilter === "Entretien RH" && sessionType !== "rh" && sessionType !== "entretien rh") return false;
        if (typeFilter === "Entretien technique" && sessionType !== "technique" && sessionType !== "entretien technique") return false;
        if (typeFilter === "Entretien comportemental" && sessionType !== "comportemental" && sessionType !== "entretien comportemental") return false;
        if (typeFilter === "Entretien direction" && sessionType !== "direction" && sessionType !== "entretien direction") return false;
      }

      if (!query) return true;
      return [session.poste, session.entreprise, session.type]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [dateFilter, search, sessions, typeFilter]);

  const resumeSession = (session) => {
    setActiveSessionId(session.id || session._id);
    navigate("/entretien", { state: { sessionId: session.id || session._id } });
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet entretien ?")) {
      if (String(sessionId).startsWith("local-")) {
        deleteLocalSession(sessionId);
        setSessions(getLocalSessions());
        setStats((current) => ({ ...current, ...getLocalStats() }));
      } else {
        const res = await sessionAPI.supprimer(sessionId);
        if (res.success) {
          deleteLocalSession(sessionId);
          setSessions((current) => current.filter((s) => (s.id || s._id) !== sessionId));
          const statsRes = await userAPI.getStats();
          if (statsRes.success) {
            setStats((current) => ({ ...current, ...statsRes.stats }));
          } else {
            setStats((current) => ({ ...current, ...getLocalStats() }));
          }
        } else {
          alert(res.message || "Erreur lors de la suppression de la session");
        }
      }
    }
  };

  const handleExport = () => {
    const dataToExport = {
      stats,
      sessions: filteredSessions,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique-entretien-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Sessions totales", value: String(stats.totalSessions), ic: "mic", color: "purple" },
    { label: "Score moyen", value: `${stats.scoreMoyen}%`, ic: "trend", color: "gray" },
    { label: "Temps total", value: `${stats.tempsTotal}m`, ic: "clock", color: "purple" },
    { label: "Meilleur score", value: `${stats.meilleurScore}%`, ic: "trendUp", color: "green" },
    { label: "Amélioration", value: stats.amelioration, ic: "trendUp", color: "orange" },
  ];

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.topbar}>
            <div>
              <h1>Historique des sessions</h1>
              <p>Consultez vos performances et suivez votre progression</p>
            </div>
            <div className={styles.topbarActions}>
              <button className={styles.btnExport} onClick={handleExport}>{ICONS.download} Exporter</button>
              <button className={styles.btnNew} onClick={() => navigate("/simulation")}>
                {ICONS.play} Nouvelle session
              </button>
            </div>
          </div>

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

          <div className={styles.filters}>
            <div className={styles.searchWrap}>
              {ICONS.search}
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Rechercher dans vos sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.filterBtn}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ background: "var(--white)", outline: "none" }}
            >
              <option value="Tous les types">Tous les types</option>
              <option value="Entretien RH">Entretien RH</option>
              <option value="Entretien technique">Entretien technique</option>
              <option value="Entretien comportemental">Entretien comportemental</option>
              <option value="Entretien direction">Entretien direction</option>
            </select>
            <select
              className={styles.filterBtn}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ background: "var(--white)", outline: "none" }}
            >
              <option value="Date (plus récent)">Date (plus récent)</option>
              <option value="Date (plus ancien)">Date (plus ancien)</option>
              <option value="score (plus élevé)">Score (plus élevé)</option>
              <option value="durée">Durée</option>
              <option value="type">Type</option>
            </select>
          </div>

          <div className={styles.sessionsSection}>
            <h2 className={styles.sessionsTitle}>{ICONS.calendar} Sessions récentes</h2>

            {filteredSessions.length === 0 ? (
              <div className={styles.empty}>
                {ICONS.mic}
                <p className={styles.emptyTitle}>Aucun entretien trouvé</p>
                <p className={styles.emptySub}>Vous n'avez pas encore réalisé d'entretien.</p>
                <button className={styles.btnStart} onClick={() => navigate("/simulation")}>
                  {ICONS.play} Commencer votre premier entretien
                </button>
              </div>
            ) : (
              <div className={styles.sessionsList}>
                {filteredSessions.map((session) => (
                  <div key={session.id || session._id} className={styles.sessionCard}>
                    <div className={styles.sessionMain}>
                      <strong>{session.poste || "Entretien"}</strong>
                      <span>{session.entreprise || "Entreprise non renseignée"} - {session.duree ?? 0} min</span>
                    </div>
                    <div className={styles.sessionMeta}>
                      <span>{session.status === "terminee" ? `${session.score ?? 0}%` : "En cours"}</span>
                      <div className={styles.sessionCardActions}>
                        <button onClick={() => resumeSession(session)}>
                          {session.status === "terminee" ? "Voir" : "Reprendre"}
                        </button>
                        <button className={styles.btnDelete} onClick={() => handleDeleteSession(session.id || session._id)}>
                          {ICONS.trash}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
