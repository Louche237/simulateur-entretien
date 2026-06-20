import { useState } from "react";
import styles from "./AuthPage.module.css";
import { authAPI } from "../../utils/api";

const EYE_ON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EYE_OFF = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const STRENGTH_LABELS = ["", "Très faible", "Faible", "Correct", "Fort", "Très fort"];
const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

const startLocalSession = (user) => {
  localStorage.setItem("token", "local-dev-token");
  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "/dashboard";
};

function getStrength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 5);
}

function LoginForm({ onSwitch }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  const change = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
    setGlobalErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.includes("@")) errs.email = "E-mail invalide";
    if (!form.password) errs.password = "Requis";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const data = await authAPI.connexion({ email: form.email, password: form.password });
    setLoading(false);
    if (data.success) {
      localStorage.clear();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
      return;
    }

    if (data.offline) {
      startLocalSession({
        prenom: form.email.split("@")[0],
        nom: "",
        email: form.email,
      });
      return;
    }

    setGlobalErr(data.message || "Email ou mot de passe incorrect");
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.fhead}>
        <h2 className={styles.ftitle}>Bon retour</h2>
        <p className={styles.fsub}>Connectez-vous à votre espace</p>
      </div>

      {globalErr && (
        <div className={styles.errBox}>
          <span className={styles.errIc}>!</span>
          <span>{globalErr}</span>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="l-email">Adresse e-mail</label>
        <input id="l-email" name="email" type="email" placeholder="noel@exemple.com"
          className={errors.email ? styles.errInp : ""}
          value={form.email} onChange={change} />
        {errors.email && <span className={styles.ferr}>{errors.email}</span>}
      </div>

      <div className={styles.field}>
        <div className={styles.lblRow}>
          <label htmlFor="l-pwd">Mot de passe</label>
          <a href="#" className={styles.forgot}>Mot de passe oublié ?</a>
        </div>
        <div className={styles.inpWrap}>
          <input id="l-pwd" name="password" type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            className={errors.password ? styles.errInp : ""}
            value={form.password} onChange={change} />
          <button type="button" className={styles.eye} onClick={() => setShowPwd((v) => !v)}>
            {showPwd ? EYE_OFF : EYE_ON}
          </button>
        </div>
        {errors.password && <span className={styles.ferr}>{errors.password}</span>}
      </div>

      <button type="submit" className={styles.btn} disabled={loading}>
        {loading ? <span className={styles.spinner} /> : "Se connecter"}
      </button>

      <p className={styles.switchP}>
        Pas encore de compte ?{" "}
        <button type="button" className={styles.swLnk} onClick={onSwitch}>S'inscrire</button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const strength = getStrength(form.password);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "Requis";
    if (!form.lastName.trim()) errs.lastName = "Requis";
    if (!form.email.includes("@")) errs.email = "E-mail invalide";
    if (form.password.length < 8) errs.password = "8 caractères minimum";
    if (form.password !== form.confirm) errs.confirm = "Les mots de passe ne correspondent pas";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const data = await authAPI.inscription({
      prenom: form.firstName,
      nom: form.lastName,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (data.success) {
      localStorage.clear();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
      return;
    }

    if (data.offline) {
      startLocalSession({
        prenom: form.firstName,
        nom: form.lastName,
        email: form.email,
      });
      return;
    }

    if (data.errors) {
      const newErrs = {};
      data.errors.forEach((err) => { newErrs[err.path] = err.msg; });
      setErrors(newErrs);
      return;
    }

    setErrors({ email: data.message });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.fhead}>
        <h2 className={styles.ftitle}>Créer un compte</h2>
        <p className={styles.fsub}>Commencez à vous entraîner gratuitement</p>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="r-fn">Prénom</label>
          <input id="r-fn" name="firstName" type="text" placeholder="Jean"
            className={errors.firstName ? styles.errInp : ""}
            value={form.firstName} onChange={change} />
          {errors.firstName && <span className={styles.ferr}>{errors.firstName}</span>}
        </div>
        <div className={styles.field}>
          <label htmlFor="r-ln">Nom</label>
          <input id="r-ln" name="lastName" type="text" placeholder="Dupont"
            className={errors.lastName ? styles.errInp : ""}
            value={form.lastName} onChange={change} />
          {errors.lastName && <span className={styles.ferr}>{errors.lastName}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="r-email">Adresse e-mail</label>
        <input id="r-email" name="email" type="email" placeholder="vous@exemple.com"
          className={errors.email ? styles.errInp : ""}
          value={form.email} onChange={change} />
        {errors.email && <span className={styles.ferr}>{errors.email}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="r-pwd">Mot de passe</label>
        <div className={styles.inpWrap}>
          <input id="r-pwd" name="password" type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            className={errors.password ? styles.errInp : ""}
            value={form.password} onChange={change} />
          <button type="button" className={styles.eye} onClick={() => setShowPwd((v) => !v)}>
            {showPwd ? EYE_OFF : EYE_ON}
          </button>
        </div>
        {form.password && (
          <div className={styles.strWrap}>
            <div className={styles.strBar}>
              {[1,2,3,4,5].map((i) => (
                <div key={i} className={styles.seg}
                  style={{ background: i <= strength ? STRENGTH_COLORS[strength] : "#e5e7eb" }} />
              ))}
            </div>
            <span className={styles.strLbl} style={{ color: STRENGTH_COLORS[strength] }}>
              {STRENGTH_LABELS[strength]}
            </span>
          </div>
        )}
        {errors.password && <span className={styles.ferr}>{errors.password}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="r-confirm">Confirmer le mot de passe</label>
        <input id="r-confirm" name="confirm" type={showPwd ? "text" : "password"}
          placeholder="••••••••"
          className={errors.confirm ? styles.errInp : ""}
          value={form.confirm} onChange={change} />
        {errors.confirm && <span className={styles.ferr}>{errors.confirm}</span>}
      </div>

      <button type="submit" className={styles.btn} disabled={loading}>
        {loading ? <span className={styles.spinner} /> : "Créer mon compte"}
      </button>

      <p className={styles.switchP}>
        Déjà un compte ?{" "}
        <button type="button" className={styles.swLnk} onClick={onSwitch}>Se connecter</button>
      </p>
    </form>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState("login");

  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.logo}>
            <img src="/logo/icon-192.png" alt="logo" className={styles.logoImg} />
            <span className={styles.logoText}>JobMentor</span>
          </div>
          <div className={styles.pitch}>
            <h1>Entraînez-vous.<br />Progressez.<br />Décrochez le poste.</h1>
            <p>Simulez un entretien réel avec un agent IA, analysez vos performances et recevez des conseils personnalisés.</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><span className={styles.statNum}>3 min</span><span className={styles.statLbl}>pour démarrer</span></div>
            <div className={styles.statDiv} />
            <div className={styles.stat}><span className={styles.statNum}>100%</span><span className={styles.statLbl}>vocal & interactif</span></div>
            <div className={styles.statDiv} />
            <div className={styles.stat}><span className={styles.statNum}>IA</span><span className={styles.statLbl}>feedback temps réel</span></div>
          </div>
        </div>
        <div className={styles.deco1} /><div className={styles.deco2} /><div className={styles.deco3} />
      </aside>

      <main className={styles.formZone}>
        <div className={styles.card}>
          <div className={styles.toggle}>
            <button className={`${styles.tab} ${tab === "login" ? styles.active : ""}`} onClick={() => setTab("login")}>Connexion</button>
            <button className={`${styles.tab} ${tab === "register" ? styles.active : ""}`} onClick={() => setTab("register")}>Inscription</button>
          </div>
          <div className={styles.formBody}>
            {tab === "login"
              ? <LoginForm onSwitch={() => setTab("register")} />
              : <RegisterForm onSwitch={() => setTab("login")} />}
          </div>
        </div>
        <p className={styles.legal}>
          En continuant, vous acceptez nos <a href="#">conditions d'utilisation</a> et notre <a href="#">politique de confidentialité</a>.
        </p>
      </main>
    </div>
  );
}
