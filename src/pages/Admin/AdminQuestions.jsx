import { useState } from "react";
import {
  RotateCcw,
  Plus,
  Search,
  Edit3,
  Trash2,
} from "lucide-react";
import styles from "./Admin.module.css";
import QuestionModal from "./Modals/QuestionModal";

export default function AdminQuestions({
  questions,
  onCreateQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onResetQuestions,
  onRefresh,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = Array.from(new Set(questions.map((q) => q.category || "general")));

  const filteredQuestions = questions.filter((q) => {
    const matchesCat =
      selectedCategory === "all" ? true : q.category === selectedCategory;
    const matchesSearch =
      (q.text || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleSave = async (formData, id) => {
    if (id) {
      await onUpdateQuestion(id, formData);
    } else {
      await onCreateQuestion(formData);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Banque de Questions ({questions.length})</h2>
          <p className={styles.sectionDesc}>
            Gérez le catalogue de questions utilisées par le simulateur d'entretien IA.
          </p>
        </div>
        <div className={styles.headerBtnGroup}>
          <button className={styles.secondaryBtn} onClick={onResetQuestions}>
            <RotateCcw size={15} strokeWidth={2} />
            <span>Réinitialiser le pack</span>
          </button>
          <button className={styles.primaryBtn} onClick={handleOpenCreate}>
            <Plus size={16} strokeWidth={2} />
            <span>Ajouter une question</span>
          </button>
        </div>
      </div>

      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIconSvg} strokeWidth={2} />
          <input
            type="text"
            placeholder="Rechercher une question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Catégorie :</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Toutes ({questions.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({questions.filter((q) => q.category === cat).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.questionsGrid}>
        {filteredQuestions.length === 0 ? (
          <div className={styles.emptyCard}>
            <p>Aucune question trouvée pour ce filtre.</p>
          </div>
        ) : (
          filteredQuestions.map((question, idx) => (
            <div key={question.id || idx} className={styles.questionCard}>
              <div className={styles.questionCardHeader}>
                <span className={styles.categoryPill}>{question.category}</span>
                <span
                  className={
                    question.isActive !== false ? styles.activeTag : styles.inactiveTag
                  }
                >
                  {question.isActive !== false ? "Active" : "Désactivée"}
                </span>
              </div>
              <p className={styles.questionCardText}>« {question.text} »</p>

              {question.focus && (
                <div className={styles.questionDetailRow}>
                  <strong>Focus :</strong> <span>{question.focus}</span>
                </div>
              )}
              {question.followUp && (
                <div className={styles.questionDetailRow}>
                  <strong>Relance :</strong> <span>{question.followUp}</span>
                </div>
              )}

              <div className={styles.questionCardActions}>
                <button
                  className={styles.actionBtnEdit}
                  onClick={() => handleOpenEdit(question)}
                >
                  <Edit3 size={13} strokeWidth={2} />
                  <span>Modifier</span>
                </button>
                <button
                  className={styles.actionBtnDelete}
                  onClick={() => onDeleteQuestion(question.id)}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        question={editingQuestion}
      />
    </div>
  );
}
