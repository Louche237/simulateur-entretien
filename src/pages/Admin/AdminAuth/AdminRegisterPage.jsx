import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Check,
} from "lucide-react";
import { adminAuthAPI } from "../../../utils/api";
import styles from "./AdminAuth.module.css";

export default function AdminRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirm: "",
    adminKey: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const isMinLength = form.password.length >= 8;
  const isMatch = Boolean(form.password && form.confirm && form.password === form.confirm);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim() || !form.password || !form.adminKey) {
      setError("Veuillez remplir l'ensemble des champs requis.");
      return;
    }

    if (!isMinLength) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (!isMatch) {
      setError("Les deux mots de passe saisis ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await adminAuthAPI.register({
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        password: form.password,
        adminKey: form.adminKey.trim(),
      });

      if (res.success) {
        setSuccessMsg("Compte administrateur créé avec succès ! Connexion automatique en cours...");
        localStorage.clear();
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setTimeout(() => {
          navigate("/admin");
        }, 1200);
      } else {
        setError(res.message || "Erreur lors de la création du compte administrateur.");
      }
    } catch (err) {
      setError("Connexion au serveur impossible. Vérifiez que le backend est démarré.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminAuthPage}>
      <div className={styles.ambientGlow} />

      <div className={`${styles.authCard} ${styles.authCardWide}`}>
        <div className={styles.cardTopBorder} />

        <div className={styles.badgeHeader}>
          <div className={styles.logoContainer}>
            <img src="/logo/icon-192.png" alt="JobMentor" className={styles.logoImg} />
          </div>

          <div className={styles.headerBadges}>
            <span className={styles.adminBadge}>
              <ShieldCheck size={12} strokeWidth={2.5} />
              Enrôlement Admin
            </span>
            <span className={styles.statusPill} style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
              <KeyRound size={12} />
              Clé Requise
            </span>
          </div>

          <h1 className={styles.title}>Création de Compte Admin</h1>
          <p className={styles.subtitle}>Enregistrement d'un nouvel administrateur système sur la plateforme</p>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} className={styles.errorIcon} />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className={styles.successAlert} role="status">
            <CheckCircle2 size={18} className={styles.successIcon} />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="admin-prenom">
                Prénom
              </label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="admin-prenom"
                  type="text"
                  name="prenom"
                  placeholder="Alexandre"
                  value={form.prenom}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="admin-nom">
                Nom
              </label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="admin-nom"
                  type="text"
                  name="nom"
                  placeholder="Martin"
                  value={form.nom}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="admin-email">
              Email professionnel administrateur
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="admin-email"
                type="email"
                name="email"
                placeholder="alex.martin@jobmentor.fr"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="admin-pwd">
                Mot de passe
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="admin-pwd"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.inputWithAction}`}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggleBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="admin-confirm">
                Confirmer
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="admin-confirm"
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  placeholder="••••••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.inputWithAction}`}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggleBtn}
                  onClick={() => setShowConfirm((prev) => !prev)}
                  title={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Validation réactive en temps réel */}
          {(form.password.length > 0 || form.confirm.length > 0) && (
            <div className={styles.passwordChecklist}>
              <div className={`${styles.checkItem} ${isMinLength ? styles.checkItemValid : ""}`}>
                {isMinLength ? <Check size={12} strokeWidth={3} /> : <span className={styles.checkBullet} />}
                <span>8 caractères minimum</span>
              </div>
              <div className={`${styles.checkItem} ${isMatch ? styles.checkItemValid : ""}`}>
                {isMatch ? <Check size={12} strokeWidth={3} /> : <span className={styles.checkBullet} />}
                <span>Les mots de passe correspondent</span>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="admin-key">
              <span>Code secret d'accès Administrateur</span>
              <span className={styles.labelHint}>(Clé d'infrastructure)</span>
            </label>
            <div className={`${styles.inputWrapper} ${styles.securityKeyWrapper}`}>
              <KeyRound size={16} className={styles.inputIcon} />
              <input
                id="admin-key"
                type="password"
                name="adminKey"
                placeholder="Clé de sécurité délivrée par l'équipe (ex: ADMIN2026)"
                value={form.adminKey}
                onChange={handleChange}
                className={styles.input}
                required
                autoComplete="off"
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <span>Créer le profil Administrateur</span>
                <ArrowRight size={16} strokeWidth={2.2} />
              </>
            )}
          </button>
        </form>

        <div className={styles.footerActions}>
          <div>
            Vous possédez déjà un compte admin ?{" "}
            <Link to="/admin/login" className={styles.switchLink}>
              Se connecter ici
            </Link>
          </div>

          <div className={styles.backHomeContainer}>
            <Link to="/" className={styles.backHomeLink}>
              <ArrowLeft size={14} />
              <span>Retour à l'espace candidat</span>
            </Link>
          </div>
        </div>

        <div className={styles.securityFooterNotice}>
          <ShieldCheck size={12} />
          <span>Vérification d'habilitation cryptographique en temps réel</span>
        </div>
      </div>
    </div>
  );
}
