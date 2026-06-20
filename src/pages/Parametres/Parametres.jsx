import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { userAPI } from "../../utils/api";
import {
  getPreferredLanguage,
  getStoredUser,
  normalizeLanguage,
  setStoredUser,
} from "../../utils/preferences";
import styles from "./Parametres.module.css";

const ICONS = {
  user: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  save: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  globe: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  shield: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  download: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  creditcard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
};

const COPY = {
  fr: {
    title: "Paramètres",
    subtitle: "Configurez votre profil et vos préférences",
    profileTitle: "Profil utilisateur",
    firstName: "Prénom",
    email: "Email",
    emailLocked: "Votre email ne peut pas être modifié",
    save: "Enregistrer les modifications",
    saved: "Modifications enregistrées",
    creditsTitle: "Crédits et paiements",
    creditsEmpty: "Aucun crédit disponible",
    buyCredits: "Acheter des crédits",
    languageTitle: "Langue de l'interface",
    languageHint: "Choisissez la langue d'affichage de l'application",
    languageFr: "🇫🇷 Français",
    languageEn: "🇬🇧 Anglais",
    privacyTitle: "Données et confidentialité",
    exportData: "Exporter mes données",
    exportDesc: "Téléchargez toutes vos données de session",
    deleteTitle: "Supprimer mon compte",
    deleteDesc: "Cette action est irréversible",
    deleteBtn: "Supprimer",
    deleteConfirm: "Confirmer ?",
    saveOffline: "Backend indisponible: préférences conservées localement.",
    saveFail: "Impossible d'enregistrer les modifications.",
    deleteOffline: "Backend indisponible: suppression impossible pour le moment.",
  },
  en: {
    title: "Settings",
    subtitle: "Manage your profile and preferences",
    profileTitle: "User profile",
    firstName: "First name",
    email: "Email",
    emailLocked: "Your email cannot be edited",
    save: "Save changes",
    saved: "Changes saved",
    creditsTitle: "Credits and billing",
    creditsEmpty: "No credits available",
    buyCredits: "Buy credits",
    languageTitle: "Interface language",
    languageHint: "Choose the app display language",
    languageFr: "🇫🇷 French",
    languageEn: "🇬🇧 English",
    privacyTitle: "Data and privacy",
    exportData: "Export my data",
    exportDesc: "Download all of your session data",
    deleteTitle: "Delete my account",
    deleteDesc: "This action is irreversible",
    deleteBtn: "Delete",
    deleteConfirm: "Confirm?",
    saveOffline: "Backend unavailable: preferences saved locally.",
    saveFail: "Unable to save changes.",
    deleteOffline: "Backend unavailable: deletion not available right now.",
  },
};

export default function Parametres() {
  const [user, setUser] = useState(() => getStoredUser());
  const [prenom, setPrenom] = useState(user?.prenom || user?.firstName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [langue, setLangue] = useState(getPreferredLanguage(user?.langue || "fr"));
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const copy = COPY[normalizeLanguage(langue)] || COPY.fr;

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const res = await userAPI.getProfil();
      if (!mounted || !res.success || !res.user) return;
      setPrenom(res.user.prenom || "");
      setEmail(res.user.email || "");
      setLangue(normalizeLanguage(res.user.langue || "fr"));
      setStoredUser(res.user);
      setUser(res.user);
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLangueChange = (newLang) => {
    setLangue(newLang);
    setUser((current) => ({ ...current, langue: newLang }));
  };

  const handleSave = async () => {
    const nextLangue = normalizeLanguage(langue);
    const res = await userAPI.modifierProfil({ prenom, langue: nextLangue });
    const localUser = { ...(getStoredUser() || {}), prenom, email, langue: nextLangue };

    if (res.success && res.user) {
      setStoredUser(res.user);
      setUser(res.user);
      setLangue(normalizeLanguage(res.user.langue || nextLangue));
      setMessage(copy.saved);
    } else if (res.offline) {
      setStoredUser(localUser);
      setUser(localUser);
      setMessage(copy.saveOffline);
    } else {
      setMessage(res.message || copy.saveFail);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 4000);
      return;
    }

    const res = await userAPI.supprimerCompte();
    if (res.success) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    setMessage(res.offline ? copy.deleteOffline : res.message);
  };

  return (
    <div className={styles.layout}>
      <Sidebar user={user} key={langue} />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          {message && <p className={styles.fieldHint}>{message}</p>}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{ICONS.user} {copy.profileTitle}</h2>
            <div className={styles.card}>
              <div className={styles.field}>
                <label className={styles.label}>{copy.firstName}</label>
                <input
                  className={styles.input}
                  placeholder={copy.firstName}
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{copy.email}</label>
                <input type="email" className={`${styles.input} ${styles.inputDisabled}`} value={email} disabled />
                <span className={styles.fieldHint}>{copy.emailLocked}</span>
              </div>
              <button className={styles.btnSave} onClick={handleSave}>
                {ICONS.save}
                {saved ? copy.saved : copy.save}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{ICONS.creditcard} {copy.creditsTitle}</h2>
            <div className={styles.card}>
              <p className={styles.emptyText}>{copy.creditsEmpty}</p>
              <button className={styles.btnCredits}>{ICONS.creditcard} {copy.buyCredits}</button>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{ICONS.globe} {copy.languageTitle}</h2>
            <div className={styles.card}>
              <p className={styles.fieldHint} style={{ marginBottom: 14 }}>
                {copy.languageHint}
              </p>
              <div className={styles.langGrid}>
                <button
                  className={`${styles.langBtn} ${langue === "fr" ? styles.langActive : ""}`}
                  onClick={() => handleLangueChange("fr")}
                >
                  {copy.languageFr}
                </button>
                <button
                  className={`${styles.langBtn} ${langue === "en" ? styles.langActive : ""}`}
                  onClick={() => handleLangueChange("en")}
                >
                  {copy.languageEn}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{ICONS.shield} {copy.privacyTitle}</h2>
            <div className={styles.card}>
              <div className={styles.dataRow}>
                <div>
                  <div className={styles.dataLabel}>{copy.exportData}</div>
                  <div className={styles.dataDesc}>{copy.exportDesc}</div>
                </div>
                <button className={styles.btnExport}>{ICONS.download} {copy.exportData}</button>
              </div>
              <div className={styles.divider} />
              <div className={styles.dataRow}>
                <div>
                  <div className={styles.dataLabel}>{copy.deleteTitle}</div>
                  <div className={styles.dataDesc}>{copy.deleteDesc}</div>
                </div>
                <button
                  className={`${styles.btnDelete} ${showDeleteConfirm ? styles.btnDeleteConfirm : ""}`}
                  onClick={handleDelete}
                >
                  {ICONS.trash}
                  {showDeleteConfirm ? copy.deleteConfirm : copy.deleteBtn}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.bottomBar}>
            <button className={styles.btnSaveBottom} onClick={handleSave}>
              {ICONS.save}
              {saved ? copy.saved : copy.save}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
