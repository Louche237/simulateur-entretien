import { useState, useEffect } from "react";
import { X } from "lucide-react";
import styles from "../Admin.module.css";

const CATEGORIES = [
  { value: "presentation", label: "Présentation" },
  { value: "motivation", label: "Motivation" },
  { value: "experience", label: "Expérience & Réalisations" },
  { value: "behavioral", label: "Comportemental / Situationnel" },
  { value: "technical", label: "Compétences Techniques" },
  { value: "culture", label: "Culture & Travail en équipe" },
  { value: "surprise", label: "Question Imprévue / Déstabilisante" },
  { value: "closure", label: "Clôture & Questions finales" },
  { value: "general", label: "Général" },
];

export default function QuestionModal({ isOpen, onClose, onSave, question }) {
  const isEditing = Boolean(question);

  const [formData, setFormData] = useState({
    category: "presentation",
    text: "",
    focus: "",
    followUp: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (question) {
      setFormData({
        category: question.category || "presentation",
        text: question.text || "",
        focus: question.focus || "",
        followUp: question.followUp || "",
        isActive: question.isActive !== undefined ? Boolean(question.isActive) : true,
      });
    } else {
      setFormData({
        category: "presentation",
        text: "",
        focus: "",
        followUp: "",
        isActive: true,
      });
    }
    setError("");
  }, [question, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      setError("Le texte de la question est obligatoire.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave(formData, question?.id);
      onClose();
    } catch (err) {
      setError(err?.message || "Erreur lors de l'enregistrement de la question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{isEditing ? "Modifier la question" : "Ajouter une question à la banque"}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {error && <div className={styles.modalError}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formField}>
            <label>Catégorie d'entretien *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label>Énoncé de la question *</label>
            <textarea
              rows={3}
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Ex: Parlez-moi d'un projet où vous avez dû surmonter un imprévu majeur."
              required
            />
          </div>

          <div className={styles.formField}>
            <label>Critère d'évaluation principal (Focus coach IA)</label>
            <input
              type="text"
              value={formData.focus}
              onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
              placeholder="Ex: Méthode STAR, sang-froid et communication"
            />
          </div>

          <div className={styles.formField}>
            <label>Relance suggérée (Follow-up)</label>
            <input
              type="text"
              value={formData.followUp}
              onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
              placeholder="Ex: Quel a été l'impact mesurable pour l'équipe ?"
            />
          </div>

          <div className={styles.formField}>
            <label>Statut</label>
            <select
              value={formData.isActive ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
            >
              <option value="true">Actif (Inclus dans les simulations)</option>
              <option value="false">Désactivé (Archivé)</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? "Enregistrement..." : isEditing ? "Sauvegarder" : "Créer la question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
