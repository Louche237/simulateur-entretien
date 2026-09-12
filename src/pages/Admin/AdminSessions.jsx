import { useState } from "react";
import {
  RefreshCw,
  Search,
  Building2,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import styles from "./Admin.module.css";
import SessionDetailModal from "./Modals/SessionDetailModal";

export default function AdminSessions({ sessions, onDeleteSession, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);

  const filteredSessions = sessions.filter((s) => {
    const candidateStr = s.user
      ? `${s.user.prenom} ${s.user.nom} ${s.user.email}`.toLowerCase()
      : "";
    const posteStr = (s.poste || "").toLowerCase();
    const matchesSearch =
      candidateStr.includes(searchTerm.toLowerCase()) ||
      posteStr.includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Sessions & Entretiens Passés ({sessions.length})</h2>
          <p className={styles.sectionDesc}>
            Supervisez toutes les simulations réalisées par les candidats sur la plateforme.
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh}>
          <RefreshCw size={15} strokeWidth={2} />
          <span>Actualiser</span>
        </button>
      </div>

      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIconSvg} strokeWidth={2} />
          <input
            type="text"
            placeholder="Rechercher par candidat, poste, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Statut :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Toutes ({sessions.length})</option>
            <option value="terminee">Terminées ({sessions.filter((s) => s.status === "terminee").length})</option>
            <option value="en_cours">En cours ({sessions.filter((s) => s.status === "en_cours").length})</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Candidat</th>
              <th>Poste visé</th>
              <th>Difficulté / Type</th>
              <th>Statut</th>
              <th>Score</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.emptyCell}>
                  Aucune session ne correspond à vos critères de recherche.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td className={styles.monoId}>{session.id}</td>
                  <td>
                    {session.user ? (
                      <div>
                        <strong>{session.user.prenom} {session.user.nom}</strong>
                        <div className={styles.userEmailSub}>{session.user.email}</div>
                      </div>
                    ) : (
                      <span className={styles.unknownUser}>Utilisateur anonyme / supprimé</span>
                    )}
                  </td>
                  <td>
                    <strong>{session.poste || "Entretien général"}</strong>
                    {session.entreprise && (
                      <div className={styles.companySub}>
                        <Building2 size={12} strokeWidth={2} />
                        <span>{session.entreprise}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={styles.badgeSmall}>
                      {session.difficulte || "facile"}
                    </span>{" "}
                    <span className={styles.badgeType}>
                      {session.type?.toUpperCase() || "RH"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        session.status === "terminee"
                          ? styles.statusBadgeSuccess
                          : styles.statusBadgeWarning
                      }
                    >
                      {session.status === "terminee" ? (
                        <>
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                          <span>Terminée</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} strokeWidth={2.5} />
                          <span>En cours</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    {session.score !== null && session.score !== undefined ? (
                      <span
                        className={
                          session.score >= 70
                            ? styles.scoreHigh
                            : session.score >= 50
                            ? styles.scoreMid
                            : styles.scoreLow
                        }
                      >
                        {session.score}%
                      </span>
                    ) : (
                      <span className={styles.scoreNone}>-</span>
                    )}
                  </td>
                  <td>
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td>
                    <div className={styles.actionBtnsRow}>
                      <button
                        className={styles.actionBtnInspect}
                        onClick={() => setSelectedSession(session)}
                        title="Consulter les réponses et feedback IA"
                      >
                        <Eye size={13} strokeWidth={2} />
                        <span>Inspecter</span>
                      </button>
                      <button
                        className={styles.actionBtnDelete}
                        onClick={() => onDeleteSession(session.id)}
                        title="Supprimer cette session"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SessionDetailModal
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </div>
  );
}
