import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { adminAuthAPI } from "../../../utils/api";
import styles from "./AdminAuth.module.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.error || "");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await adminAuthAPI.login(form);
      if (res.success) {
        localStorage.clear();
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/admin");
      } else {
        setError(res.message || "Identifiants administrateur incorrects.");
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

      <div className={styles.authCard}>
        <div className={styles.cardTopBorder} />

        <div className={styles.badgeHeader}>
          <div className={styles.logoContainer}>
            <img src="/logo/icon-192.png" alt="JobMentor" className={styles.logoImg} />
          </div>

          <div className={styles.headerBadges}>
            <span className={styles.adminBadge}>
              <ShieldCheck size={12} strokeWidth={2.5} />
              Admin Console
            </span>
            <span className={styles.statusPill}>
              <span className={styles.statusDot} />
              Système Sécurisé
            </span>
          </div>

          <h1 className={styles.title}>Portail Administrateur</h1>
          <p className={styles.subtitle}>Supervision, utilisateurs & gestion de la plateforme JobMentor</p>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} className={styles.errorIcon} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="admin-email">
              Identifiant Administrateur (Email)
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="admin-email"
                type="email"
                name="email"
                placeholder="admin@jobmentor.fr"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

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
                autoComplete="current-password"
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

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <span>Accéder au Dashboard</span>
                <ArrowRight size={16} strokeWidth={2.2} />
              </>
            )}
          </button>
        </form>

        <div className={styles.footerActions}>
          <div>
            Nouveau gestionnaire ?{" "}
            <Link to="/admin/register" className={styles.switchLink}>
              Créer un compte administrateur
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
          <Lock size={12} />
          <span>Espace réservé aux équipes autorisées • Chiffrement AES-256</span>
        </div>
      </div>
    </div>
  );
}
