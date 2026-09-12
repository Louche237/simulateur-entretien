import { X } from "lucide-react";
import styles from "../Admin.module.css";

export default function SessionDetailModal({ isOpen, onClose, session }) {
  if (!isOpen || !session) return null;

  const questions = Array.isArray(session.questions) ? session.questions : [];
  const candidateName = session.user
    ? `${session.user.prenom || ""} ${session.user.nom || ""}`.trim() || session.user.email
    : "Utilisateur inconnu";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.largeModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3>Détails de la Session d'Entretien</h3>
            <span className={styles.modalSubHeader}>ID : {session.id} • Candidat : {candidateName}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className={styles.sessionMetaGrid}>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Poste Visé</span>
            <span className={styles.metaValue}>{session.poste || "Non spécifié"}</span>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Entreprise</span>
            <span className={styles.metaValue}>{session.entreprise || "Générale"}</span>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Difficulté & Type</span>
            <span className={styles.metaValue}>{session.difficulte} • {session.type?.toUpperCase()}</span>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Score Global</span>
            <span className={styles.metaValueHighlight}>
              {session.score !== null && session.score !== undefined ? `${session.score}/100` : "Non noté"}
            </span>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Statut</span>
            <span className={session.status === "terminee" ? styles.statusBadgeSuccess : styles.statusBadgeWarning}>
              {session.status === "terminee" ? "Terminée" : "En cours"}
            </span>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Date de passage</span>
            <span className={styles.metaValue}>
              {session.createdAt ? new Date(session.createdAt).toLocaleString("fr-FR") : "-"}
            </span>
          </div>
        </div>

        {session.review && (
          <div className={styles.reviewSection}>
            <h4>Synthèse du Recruteur IA</h4>
            <p className={styles.reviewSummaryText}>
              {typeof session.review === "string"
                ? session.review
                : session.review.summary || session.feedback?.summary || "Aucun résumé disponible."}
            </p>
          </div>
        )}

        <div className={styles.questionsListSection}>
          <h4>Déroulé de l'Entretien ({questions.length} questions posées)</h4>
          {questions.length === 0 ? (
            <p className={styles.emptyText}>Aucune question enregistrée dans cette session.</p>
          ) : (
            <div className={styles.questionsContainer}>
              {questions.map((q, idx) => (
                <div key={q.id || idx} className={styles.questionItemCard}>
                  <div className={styles.qHeaderRow}>
                    <span className={styles.qNumber}>Question {idx + 1}</span>
                    <span className={styles.qCategoryTag}>{q.category || "général"}</span>
                  </div>
                  <p className={styles.qText}>« {q.text} »</p>

                  <div className={styles.answerBlock}>
                    <span className={styles.answerLabel}>Réponse du candidat :</span>
                    <p className={styles.answerText}>
                      {q.answer ? q.answer : <em style={{ color: "#94a3b8" }}>Aucune réponse fournie.</em>}
                    </p>
                  </div>

                  {q.analysis && (
                    <div className={styles.analysisBlock}>
                      <span className={styles.analysisLabel}>Analyse IA :</span>
                      <p className={styles.analysisText}>
                        {typeof q.analysis === "string" ? q.analysis : q.analysis.feedback || JSON.stringify(q.analysis)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.saveBtn} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
