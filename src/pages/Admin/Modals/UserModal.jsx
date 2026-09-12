import { useState, useEffect } from "react";
import { X } from "lucide-react";
import styles from "../Admin.module.css";

export default function UserModal({ isOpen, onClose, onSave, onResetPassword, user }) {
  const isEditing = Boolean(user);

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    role: "user",
    emailConfirmed: true,
  });

  const [resetPwd, setResetPwd] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("info"); // 'info' | 'pwd'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        prenom: user.prenom || "",
        nom: user.nom || "",
        email: user.email || "",
        role: user.role || "user",
        emailConfirmed: Boolean(user.emailConfirmed),
        password: "",
      });
      setResetPwd("");
      setActiveSubTab("info");
    } else {
      setFormData({
        prenom: "",
        nom: "",
        email: "",
        password: "",
        role: "user",
        emailConfirmed: true,
      });
      setResetPwd("");
      setActiveSubTab("info");
    }
    setError("");
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isEditing && activeSubTab === "pwd") {
        if (!resetPwd || resetPwd.length < 6) {
          setError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
          setLoading(false);
          return;
        }
        await onResetPassword(user.id, resetPwd);
        onClose();
        return;
      }

      if (!formData.prenom.trim() || !formData.nom.trim() || !formData.email.trim()) {
        setError("Veuillez remplir les champs obligatoires.");
        setLoading(false);
        return;
      }

      if (!isEditing && (!formData.password || formData.password.length < 6)) {
        setError("Le mot de passe doit comporter au moins 6 caractères.");
        setLoading(false);
        return;
      }

      await onSave(formData, user?.id);
      onClose();
    } catch (err) {
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{isEditing ? `Modifier : ${user.prenom} ${user.nom}` : "Ajouter un nouvel utilisateur"}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {isEditing && (
          <div className={styles.modalSubTabs}>
            <button
              type="button"
              className={`${styles.modalSubTab} ${activeSubTab === "info" ? styles.activeSubTab : ""}`}
              onClick={() => setActiveSubTab("info")}
            >
              Informations & Rôle
            </button>
            <button
              type="button"
              className={`${styles.modalSubTab} ${activeSubTab === "pwd" ? styles.activeSubTab : ""}`}
              onClick={() => setActiveSubTab("pwd")}
            >
              Réinitialiser le mot de passe
            </button>
          </div>
        )}

        {error && <div className={styles.modalError}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {(!isEditing || activeSubTab === "info") && (
            <>
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label>Adresse e-mail *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {!isEditing && (
                <div className={styles.formField}>
                  <label>Mot de passe temporaire *</label>
                  <input
                    type="password"
                    placeholder="Min. 6 caractères"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>Rôle du compte</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="user">Candidat (Utilisateur standard)</option>
                    <option value="admin">Administrateur (Accès complet)</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Email validé</label>
                  <select
                    value={formData.emailConfirmed ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, emailConfirmed: e.target.value === "true" })}
                  >
                    <option value="true">Oui (Confirmé)</option>
                    <option value="false">Non (En attente)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {isEditing && activeSubTab === "pwd" && (
            <div className={styles.formField}>
              <label>Nouveau mot de passe pour l'utilisateur</label>
              <input
                type="password"
                placeholder="Nouveau mot de passe (min 6 car.)"
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
                required
              />
              <span className={styles.hintText}>
                L'utilisateur pourra ensuite se connecter immédiatement avec ce nouveau mot de passe.
              </span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? "Enregistrement..." : isEditing ? (activeSubTab === "pwd" ? "Changer le mot de passe" : "Enregistrer les modifications") : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
