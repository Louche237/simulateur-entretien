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

  useEffect(() => {
    const confirm = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token de confirmation manquant");
        return;
      }

      try {
        const res = await authAPI.confirmerEmail(token);
        if (res.success) {
          setStatus("success");
          setMessage(res.message || "Votre email a été confirmé avec succès !");
          if (res.user) {
            localStorage.setItem("user", JSON.stringify(res.user));
          }
        } else {
          setStatus("error");
          setMessage(res.message || "Une erreur est survenue");
        }
      } catch {
        setStatus("error");
        setMessage("Impossible de confirmer votre email. Veuillez réessayer.");
      }
    };

    confirm();
  }, [token]);

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
              <h1>Email confirmé ! 🎉</h1>
              <p>{message}</p>
            </>
          )}
          {status === "error" && (
            <>
              <div className={styles.iconError}>!</div>
              <h1>Oups…</h1>
              <p>{message}</p>
              <p className={styles.subError}>
                Le lien est peut-être expiré ou invalide. Vous pouvez demander un nouveau lien depuis votre espace.
              </p>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate("/dashboard")}>
            {status === "success" ? "Accéder à mon espace" : "Retour à l'accueil"}
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
