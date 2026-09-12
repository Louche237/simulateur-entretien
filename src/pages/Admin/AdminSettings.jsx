import { useState } from "react";
import {
  UserCheck,
  ShieldCheck,
  KeyRound,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
} from "lucide-react";
import styles from "./Admin.module.css";
import { userAPI } from "../../utils/api";

export default function AdminSettings() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [profileForm, setProfileForm] = useState({
    prenom: currentUser.prenom || "",
    nom: currentUser.nom || "",
    email: currentUser.email || "",
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileMsg, setProfileMsg] = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setLoadingProfile(true);

    try {
      const res = await userAPI.modifierProfil({
        prenom: profileForm.prenom,
        nom: profileForm.nom,
        email: profileForm.email,
      });

      if (res.success) {
        setProfileMsg({ type: "success", text: "Profil administrateur mis à jour avec succès." });
        const updated = { ...currentUser, ...res.user };
        localStorage.setItem("user", JSON.stringify(updated));
      } else {
        setProfileMsg({ type: "error", text: res.message || "Erreur lors de la mise à jour." });
      }
    } catch (err) {
      setProfileMsg({ type: "error", text: "Erreur serveur." });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg(null);

    if (pwdForm.newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "Le nouveau mot de passe doit comporter au moins 8 caractères." });
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }

    setLoadingPwd(true);

    try {
      const res = await userAPI.modifierMotDePasse({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });

      if (res.success) {
        setPwdMsg({ type: "success", text: "Mot de passe mis à jour avec succès." });
        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwdMsg({ type: "error", text: res.message || "Mot de passe actuel incorrect." });
      }
    } catch (err) {
      setPwdMsg({ type: "error", text: "Erreur lors de la mise à jour du mot de passe." });
    } finally {
      setLoadingPwd(false);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Paramètres de la Plateforme & Sécurité</h2>
          <p className={styles.sectionDesc}>
            Gérez vos accès administrateur, les clés d'invitation et la configuration du système.
          </p>
        </div>
      </div>

      <div className={styles.settingsGrid}>
        {/* Profil Admin */}
        <div className={styles.settingCard}>
          <div className={styles.settingCardHeader}>
            <span className={`${styles.settingCardIcon} ${styles.settingIconProfile}`}>
              <UserCheck size={18} strokeWidth={2} />
            </span>
            <h3>Mon Compte Administrateur</h3>
          </div>
          {profileMsg && (
            <div
              className={
                profileMsg.type === "success"
                  ? styles.settingNoticeSuccess
                  : styles.settingNoticeError
              }
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 size={16} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={16} strokeWidth={2.5} />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className={styles.settingForm}>
            <div className={styles.formRow2}>
              <div className={styles.formField}>
                <label>Prénom</label>
                <input
                  type="text"
                  value={profileForm.prenom}
                  onChange={(e) => setProfileForm({ ...profileForm, prenom: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>Nom</label>
                <input
                  type="text"
                  value={profileForm.nom}
                  onChange={(e) => setProfileForm({ ...profileForm, nom: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label>Adresse e-mail</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
              />
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={loadingProfile}>
              <Save size={15} strokeWidth={2} />
              <span>{loadingProfile ? "Enregistrement..." : "Enregistrer mon profil"}</span>
            </button>
          </form>
        </div>

        {/* Sécurité / Mot de passe */}
        <div className={styles.settingCard}>
          <div className={styles.settingCardHeader}>
            <span className={`${styles.settingCardIcon} ${styles.settingIconSecurity}`}>
              <ShieldCheck size={18} strokeWidth={2} />
            </span>
            <h3>Sécurité & Mot de passe</h3>
          </div>
          {pwdMsg && (
            <div
              className={
                pwdMsg.type === "success"
                  ? styles.settingNoticeSuccess
                  : styles.settingNoticeError
              }
            >
              {pwdMsg.type === "success" ? (
                <CheckCircle2 size={16} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={16} strokeWidth={2.5} />
              )}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePwdSubmit} className={styles.settingForm}>
            <div className={styles.formField}>
              <label>Mot de passe actuel</label>
              <input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className={styles.formRow2}>
              <div className={styles.formField}>
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Min. 8 caractères"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>Confirmer nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Min. 8 caractères"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.secondaryBtn} disabled={loadingPwd}>
              <Lock size={15} strokeWidth={2} />
              <span>{loadingPwd ? "Modification..." : "Modifier le mot de passe"}</span>
            </button>
          </form>
        </div>

        {/* Clé d'invitation & Accès */}
        <div className={styles.settingCard}>
          <div className={styles.settingCardHeader}>
            <span className={`${styles.settingCardIcon} ${styles.settingIconAccess}`}>
              <KeyRound size={18} strokeWidth={2} />
            </span>
            <h3>Accès Administrateur & Clé d'invitation</h3>
          </div>
          <p className={styles.settingText}>
            Pour inscrire de nouveaux collaborateurs ayant accès à ce tableau de bord, transmettez-leur le lien :
          </p>
          <div className={styles.linkShareBox}>
            <code>http://localhost:5173/admin/register</code>
          </div>
          <div className={styles.keyDisplayBox}>
            <span className={styles.keyLabel}>Clé de sécurité d'inscription active :</span>
            <span className={styles.keyValueBadge}>ADMIN2026</span>
          </div>
          <span className={styles.hintText}>
            Pour changer cette clé, mettez à jour la variable <code>ADMIN_INVITE_CODE</code> dans <code>backend/.env.local</code>.
          </span>
        </div>

        {/* Moteur IA & Simulation */}
        <div className={styles.settingCard}>
          <div className={styles.settingCardHeader}>
            <span className={`${styles.settingCardIcon} ${styles.settingIconSystem}`}>
              <Cpu size={18} strokeWidth={2} />
            </span>
            <h3>Moteur IA & Serveur</h3>
          </div>
          <div className={styles.systemInfoList}>
            <div className={styles.systemInfoRow}>
              <span>Statut Simulateur IA :</span>
              <strong style={{ color: "#16a34a" }}>Opérationnel</strong>
            </div>
            <div className={styles.systemInfoRow}>
              <span>Fournisseur IA actif :</span>
              <strong>Groq / OpenAI API</strong>
            </div>
            <div className={styles.systemInfoRow}>
              <span>Serveur Backend :</span>
              <strong>http://localhost:5000</strong>
            </div>
            <div className={styles.systemInfoRow}>
              <span>Base de données :</span>
              <strong>MySQL (Sequelize ORM)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
