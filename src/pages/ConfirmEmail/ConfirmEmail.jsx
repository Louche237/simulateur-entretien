import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../../utils/api";
import styles from "./ConfirmEmail.module.css";

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  // Formulaire de réexpédition en cas d'erreur
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const confirm = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Lien de confirmation manquant ou invalide.");
        return;
      }

      try {
        const res = await authAPI.confirmerEmail(token);
        if (res.success) {
          setStatus("success");
          setMessage(res.message || "Votre adresse e-mail a été confirmée avec succès !");
          setAlreadyConfirmed(Boolean(res.alreadyConfirmed));

          if (res.token) {
            localStorage.setItem("token", res.token);
          }
          if (res.user) {
            localStorage.setItem("user", JSON.stringify(res.user));
          }
        } else {
          setStatus("error");
          setMessage(res.message || "Ce lien de confirmation est invalide ou a expiré.");
          if (res.email) setResendEmail(res.email);
        }
      } catch {
        setStatus("error");
        setMessage("Impossible de confirmer votre e-mail pour le moment. Veuillez réessayer.");
      }
    };

    confirm();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes("@") || resendLoading) return;

    setResendLoading(true);
    setResendMsg({ type: "", text: "" });

    try {
      const res = await authAPI.renvoyerConfirmation(resendEmail);
      setResendLoading(false);
      if (res.success) {
        setResendMsg({ type: "success", text: res.message || "Un nouvel e-mail vous a été envoyé !" });
      } else {
        setResendMsg({ type: "error", text: res.message || "Erreur lors du renvoi." });
      }
    } catch {
      setResendLoading(false);
      setResendMsg({ type: "error", text: "Erreur de connexion au serveur." });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          {status === "loading" && (
            <>
              <div className={styles.spinner} />
              <h1>Confirmation en cours…</h1>
              <p>Nous vérifions votre lien de confirmation.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className={styles.iconSuccess}>✓</div>
              <h1>{alreadyConfirmed ? "Déjà confirmé ! 🎉" : "E-mail confirmé ! 🎉"}</h1>
              <p>{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className={styles.iconError}>!</div>
              <h1>Lien invalide ou expiré</h1>
              <p>{message}</p>
              <p className={styles.subError}>
                Les liens de confirmation expirent au bout de 24 heures pour des raisons de sécurité.
              </p>

              <form onSubmit={handleResend} className={styles.resendBox}>
                <label htmlFor="resend-email" className={styles.resendBoxLabel}>
                  Recevoir un nouveau lien de confirmation :
                </label>
                <div className={styles.resendRow}>
                  <input
                    id="resend-email"
                    type="email"
                    placeholder="votre-email@exemple.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className={styles.resendInput}
                    required
                  />
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className={styles.resendActionBtn}
                  >
                    {resendLoading ? "Envoi..." : "Renvoyer"}
                  </button>
                </div>

                {resendMsg.type === "success" && (
                  <div className={styles.resendMsgSuccess}>✓ {resendMsg.text}</div>
                )}
                {resendMsg.type === "error" && (
                  <div className={styles.resendMsgError}>⚠ {resendMsg.text}</div>
                )}
              </form>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate("/dashboard")}>
            {status === "success" ? "Accéder à mon espace →" : "Retour à l'accueil"}
          </button>
          {status !== "success" && (
            <button className={styles.secondaryBtn} onClick={() => navigate("/")}>
              Se connecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
