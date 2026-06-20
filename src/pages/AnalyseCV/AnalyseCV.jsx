import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./AnalyseCV.module.css";
import {
  fakeExtractCV,
  scoreCVAgainstOffer,
  generateAdaptedCV,
  getOfferInsights,
} from "../../utils/cvLocal";
import { cvAPI } from "../../utils/api";
import { getPreferredLanguage } from "../../utils/preferences";

/* ─── Icônes SVG inline (même pattern que l'original) ─── */
const ICONS = {
  spark:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  upload:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  target:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  doc:     <svg width="40" height="40" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  check:   <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  checkFill: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  trash:   <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  info:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  trend:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>,
  xCircle: <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  warning: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  bulb:    <svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  search:  <svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  mic:     <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  fileEdit:<svg width="22" height="22" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  question:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

/* ─── Helpers couleur selon score ─── */
function scoreColor(s) {
  if (s >= 70) return "#22c55e";
  if (s >= 40) return "#f59e0b";
  return "#ef4444";
}



/* ─── Barre de critère ─── */
function CriterionBar({ label, score }) {
  const c = scoreColor(score);
  return (
    <div className={styles.criterionRow}>
      <div className={styles.criterionTop}>
        <span className={styles.criterionLabel}>{label}</span>
        <span className={styles.criterionBadge} style={{ backgroundColor: c }}>{score}/100</span>
      </div>
      <div className={styles.criterionBar}>
        <div className={styles.criterionFill} style={{ width: `${score}%`, backgroundColor: c }} />
      </div>
    </div>
  );
}

/* ─── Badge de sévérité ─── */
function SeverityBadge({ severity }) {
  const labels = { blocking: "bloquant", critical: "critique", important: "important", high: "priorité haute" };
  return (
    <span className={`${styles.severityBadge} ${styles[severity] || styles.important}`}>
      {labels[severity] || severity}
    </span>
  );
}

/* ─── COMPOSANT PRINCIPAL ─── */
export default function AnalyseCV() {
  const langue = getPreferredLanguage();
  const [cv, setCv] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [offre, setOffre] = useState("");
  const [offerInsights, setOfferInsights] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  /* Simulation barre de progression — nettoyée et sans boucle infinie */
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    setProgress(10);
    const steps = [30, 55, 70, 85, 92];
    const timers = [];

    steps.forEach((p, i) => {
      const timer = setTimeout(() => setProgress(p), (i + 1) * 900);
      timers.push(timer);
    });

    // Timer final pour terminer
    const finalTimer = setTimeout(() => setProgress(100), 5400);
    timers.push(finalTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [loading]);

  const handleFile = async (file) => {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!file) return;
    if (!allowed.includes(file.type)) { alert("Format non accepté. PDF, DOC ou DOCX uniquement."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Fichier trop volumineux. Max 10MB."); return; }
    setCv(file); setAnalysis(null); setExtracting(true);
    const remote = await cvAPI.extraire(file, { langue });
    if (remote.success && remote.cvData) {
      setCvData(remote.cvData);
    } else {
      const extracted = await fakeExtractCV(file);
      setCvData(extracted);
    }
    setExtracting(false);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async () => {
    if (!cvData || !offre.trim()) return;
    setLoading(true); setAnalysis(null); setError(null);

    try {
      const remote = cv
        ? await cvAPI.analyserFichier(cv, offre, { langue })
        : await cvAPI.analyser({ cvData, offer: offre, langue });

      if (remote.success && remote.analysis) {
        setProgress(100);
        setCvData(remote.cvData || cvData);
        setOfferInsights(remote.offerInsights || getOfferInsights(offre));
        setAnalysis(remote.analysis);
      } else if (remote.timeout) {
        setError("L'analyse a pris trop de temps. Vérifiez votre connexion et réessayez.");
      } else if (remote.offline) {
        setError("Le serveur est inaccessible. Assurez-vous que le backend est démarré.");
      } else {
        // Fallback local si l'IA échoue
        const result = scoreCVAgainstOffer(cvData, offre);
        setAnalysis(result);
      }
    } catch (e) {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
      console.error("handleSubmit error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCv(null); setCvData(null); setOffre(""); setOfferInsights(null);
    setAnalysis(null); setError(null);
  };

  const canSubmit = cvData && offre.trim().length > 0;

  /* Données résultats : on normalise pour la nouvelle UI */
  const globalScore = analysis?.score ?? 0;
  const criteria = analysis?.criteria ?? [
    { label: "Compétences techniques", score: analysis?.matched?.length ? Math.min(100, analysis.matched.length * 15) : 0 },
    { label: "Expérience", score: analysis?.experience ?? 0 },
    { label: "Formation", score: analysis?.formation ?? 0 },
    { label: "Soft skills", score: analysis?.softSkills ?? 0 },
    { label: "Optimisation ATS", score: analysis?.ats?.score ?? 0 },
  ];

  const strengths = analysis?.strengths ?? analysis?.matched?.map((s) => ({
    title: s, description: `Compétence présente dans votre CV et requise par l'offre.`,
  })) ?? [];

  const gaps = analysis?.gaps ?? analysis?.missing?.map((s) => ({
    category: s, severity: "important", description: `Compétence absente de votre CV.`,
    action: "Ajoutez cette compétence ou compensez avec des expériences connexes.",
  })) ?? [];

  const recommendations = analysis?.recommendations_detail ?? analysis?.recommendations?.map((r, i) => ({
    category: i % 2 === 0 ? "Contenu" : "Keywords", severity: i === 0 ? "critical" : "high", issue: r,
    suggestion: "Appliquez cette recommandation pour améliorer votre profil.",
  })) ?? [];

  const ats = analysis?.ats ?? null;
  const interviewPrep = analysis?.interviewPrep ?? null;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.container}>

          {/* EN-TÊTE */}
          <div className={styles.header}>
            <h1>{ICONS.spark} Analyse CV</h1>
            <p>
              Comparez votre CV avec une offre d'emploi et obtenez des recommandations personnalisées
              {" "}
              <span style={{ opacity: 0.72 }}>• IA en {langue === "en" ? "English" : "français"}</span>
            </p>
          </div>

          {/* COLONNES UPLOAD */}
          <div className={styles.cols}>

            {/* CV */}
            <div className={styles.col}>
              <div className={styles.colHeader}>
                <span className={styles.colIcon}>{ICONS.upload}</span>
                <div><h2>Votre CV</h2><p>Formats acceptés : PDF, DOC, DOCX (max 10MB)</p></div>
              </div>
              <div
                className={`${styles.dropZone} ${dragging ? styles.dropActive : ""} ${cv ? styles.dropFilled : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !cv && fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
                  className={styles.fileInput}
                  onChange={(e) => handleFile(e.target.files[0])} />
                {cv ? (
                  <div className={styles.filePreview}>
                    {ICONS.doc}
                    <span className={styles.fileName}>{cv.name}</span>
                    <span className={styles.fileSize}>{(cv.size / 1024).toFixed(0)} KB</span>
                    {extracting
                      ? <div className={styles.extractingMsg}><span className={styles.spinner}/> Extraction en cours...</div>
                      : <div className={styles.fileCheck}>{ICONS.check} CV analysé</div>
                    }
                    <button className={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); setCv(null); setCvData(null); setAnalysis(null); setAdapted(null); }}>
                      {ICONS.trash} Supprimer
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropContent}>
                    {ICONS.doc}
                    <span className={styles.dropTitle}>Cliquez pour uploader</span>
                    <span className={styles.dropSub}>ou glissez-déposez votre fichier</span>
                  </div>
                )}
              </div>

              {cvData && !extracting && (
                <div className={styles.extractCard}>
                  <h4>Compétences extraites</h4>
                  <div className={styles.tags}>
                    {cvData.skills.map((s) => <span key={s} className={styles.tag}>{s}</span>)}
                  </div>
                  <p className={styles.extractNote}>
                    {ICONS.info} Titre détecté : <strong>{cvData.title}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* OFFRE */}
            <div className={styles.col}>
              <div className={styles.colHeader}>
                <span className={styles.colIcon}>{ICONS.target}</span>
                <div><h2>Offre d'emploi</h2><p>Collez la description du poste visé</p></div>
              </div>
              <textarea className={styles.textarea}
                placeholder="Copiez-collez ici la description du poste, les compétences requises, les responsabilités, etc."
                value={offre}
                onChange={(e) => { setOffre(e.target.value); setOfferInsights(getOfferInsights(e.target.value)); }}
              />
              {offerInsights && offerInsights.keywords.length > 0 && (
                <div className={styles.insightsCard}>
                  <div className={styles.insightsRow}>
                    <span className={styles.insightPill} style={{ background: "#f5f3ff", color: "#7c3aed" }}>{offerInsights.typePoste}</span>
                    <span className={styles.insightPill} style={{ background: "#fef3c7", color: "#d97706" }}>{offerInsights.niveau}</span>
                    {offerInsights.salaire && (
                      <span className={styles.insightPill} style={{ background: "#f0fdf4", color: "#16a34a" }}>{offerInsights.salaire}</span>
                    )}
                  </div>
                  <p className={styles.insightsLabel}>Mots-clés détectés :</p>
                  <div className={styles.tags}>
                    {offerInsights.keywords.map((k) => <span key={k} className={styles.tagOutline}>{k}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOUTON ANALYSER */}
          <div className={styles.footer}>
            <button
              className={`${styles.btnAnalyse} ${!canSubmit || loading ? styles.btnDisabled : ""}`}
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
            >
              {loading
                ? <><span className={styles.spinner}/> Analyse en cours...</>
                : <>{ICONS.spark} Analyser mon CV</>
              }
            </button>

            {loading && (
              <div className={styles.progressWrap}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%`, transition: "width 0.6s ease" }}
                  />
                </div>
                <p className={styles.progressLabel}>
                  {progress < 92
                    ? `Analyse en cours... ${progress}%`
                    : "Finalisation de l'analyse IA… ⏳"}
                </p>
              </div>
            )}
          </div>

          {error && !loading && (
            <div className={styles.errorBanner}>
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              <div>
                <strong>Erreur</strong>
                <p>{error}</p>
              </div>
              <button className={styles.errorDismiss} onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* ═══════════════ RÉSULTATS ═══════════════ */}
          {analysis && (
            <>
              {/* SCORE BANNER */}
              <div className={styles.scoreBanner}>
                <p className={styles.scoreBannerLabel}>Score de compatibilité</p>
                <p className={styles.scoreBannerValue}>{globalScore}%</p>
                <p className={styles.scoreBannerMsg}>
                  {globalScore >= 70
                    ? "Votre profil correspond bien au poste."
                    : globalScore >= 40
                    ? "Des écarts modérés ont été identifiés. Consultez les recommandations ci-dessous."
                    : "Des écarts importants ont été identifiés. Consultez les recommandations ci-dessous."}
                </p>
              </div>

              {/* CRITÈRES */}
              <div className={styles.criteriaSection}>
                <div className={styles.criteriaTitle}>{ICONS.trend} Analyse détaillée par critère</div>
                <div className={styles.criteriaGrid}>
                  {criteria.map((c) => <CriterionBar key={c.label} label={c.label} score={c.score} />)}
                </div>
              </div>

              {/* INSIGHTS */}
              <div className={styles.insightsSection}>

                {/* Points forts */}
                {strengths.length > 0 && (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionTitle} style={{ color: "#15803d" }}>
                      {ICONS.checkFill} Points forts de votre CV
                    </div>
                    {strengths.map((s, i) => (
                      <div key={i} className={styles.strengthCard}>
                        <span className={styles.strengthIcon}>{ICONS.checkFill}</span>
                        <div>
                          <p className={styles.strengthTitle}>{s.title}</p>
                          <p className={styles.strengthDesc}>{s.description}</p>
                          {s.note && <p className={styles.strengthNote}>📌 {s.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Compétences à développer */}
                {gaps.filter(g => ["important","critical"].includes(g.severity)).length > 0 && (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionTitle} style={{ color: "#b45309" }}>
                      {ICONS.warning} Compétences à développer
                    </div>
                    {gaps.filter(g => ["important","critical"].includes(g.severity)).map((g, i) => (
                      <div key={i} className={`${styles.gapCard} ${styles[g.severity] || styles.important}`}>
                        <div className={styles.gapCardTop}>
                          <span className={styles.gapCategory}>{g.category}</span>
                          <SeverityBadge severity={g.severity} />
                        </div>
                        {g.impact && <p className={styles.gapDesc}>💥 Impact : {g.impact}</p>}
                        {g.formation && <p className={styles.gapDesc}>📚 Formation : {g.formation}</p>}
                        {g.alternative && <p className={styles.gapDesc}>💡 Alternative : {g.alternative}</p>}
                        {!g.impact && <p className={styles.gapDesc}>{g.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Écarts bloquants */}
                {gaps.filter(g => g.severity === "blocking").length > 0 && (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionTitle} style={{ color: "#ef4444" }}>
                      {ICONS.xCircle} Écarts identifiés
                    </div>
                    {gaps.filter(g => g.severity === "blocking").map((g, i) => (
                      <div key={i} className={`${styles.gapCard} ${styles.blocking}`}>
                        <div className={styles.gapCardTop}>
                          <span className={styles.gapCategory}>{g.category}</span>
                          <SeverityBadge severity="blocking" />
                        </div>
                        <p className={styles.gapDesc}>{g.description}</p>
                        {g.action && <p className={styles.gapAction}>➡️ {g.action}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommandations */}
                {recommendations.length > 0 && (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionTitle} style={{ color: "#7c3aed" }}>
                      {ICONS.bulb} Recommandations pour améliorer votre CV
                    </div>
                    {recommendations.map((r, i) => (
                      <div key={i} className={`${styles.recoCard} ${styles[r.severity] || styles.high}`}>
                        <div className={styles.recoCardTop}>
                          <span className={styles.recoCategory}>{r.category}</span>
                          <SeverityBadge severity={r.severity} />
                        </div>
                        <p className={styles.recoIssue}>⚠️ {r.issue}</p>
                        <p className={styles.recoSuggestion}>✅ {r.suggestion}</p>
                        {(r.before || r.after) && (
                          <div className={styles.recoDiff}>
                            {r.before && <div className={styles.recoDiffBefore}>❌ Avant → ✅ Après : {r.after}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ATS */}
                {ats && (
                  <div className={styles.atsSection}>
                    <div className={styles.atsHeader}>
                      <div className={styles.atsTitle}>{ICONS.search} Optimisation ATS (Systèmes de Tracking)</div>
                      <span className={styles.atsScore}>Score ATS : {ats.score}/100</span>
                    </div>
                    {ats.missingKeywords?.length > 0 && (
                      <div className={styles.atsGroup}>
                        <p className={styles.atsGroupLabel}>🔑 Mots-clés manquants :</p>
                        <div className={styles.atsTagRow}>
                          {ats.missingKeywords.map((k) => <span key={k} className={styles.atsTag}>{k}</span>)}
                        </div>
                      </div>
                    )}
                    {ats.density && (
                      <div className={styles.atsGroup}>
                        <p className={styles.atsGroupLabel}>📊 Densité de mots-clés :</p>
                        <p className={styles.atsDensity}>{ats.density}</p>
                      </div>
                    )}
                    {ats.formatIssues?.length > 0 && (
                      <div className={styles.atsGroup}>
                        <p className={styles.atsGroupLabel}>{ICONS.warning} Problèmes de format :</p>
                        <div className={styles.atsIssues}>
                          {ats.formatIssues.map((issue) => (
                            <p key={issue} className={styles.atsIssue}>• {issue}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Préparation entretien */}
                {interviewPrep && (
                  <div className={styles.prepSection}>
                    <div className={styles.prepTitle}>{ICONS.bulb} Préparation à l'entretien</div>
                    {interviewPrep.highlights?.length > 0 && (
                      <div className={styles.prepHighlights}>
                        <p className={styles.prepHighlightsLabel}>🎯 Points à mettre en avant :</p>
                        {interviewPrep.highlights.map((h) => (
                          <div key={h} className={styles.prepHighlight}>
                            <span style={{ color: "#22c55e" }}>{ICONS.checkFill}</span> {h}
                          </div>
                        ))}
                      </div>
                    )}
                    {interviewPrep.questions?.length > 0 && (
                      <>
                        <p className={styles.prepQLabel}>{ICONS.question} Questions probables :</p>
                        {interviewPrep.questions.map((q, i) => (
                          <div key={i} className={styles.prepQuestion}>
                            <p className={styles.prepQ}>Q: {q.question}</p>
                            <p className={styles.prepHint}>💡 {q.hint}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className={styles.ctaRow}>
                  <div className={styles.ctaCard}>
                    <div className={styles.ctaIcon}>{ICONS.fileEdit}</div>
                    <h4 className={styles.ctaTitle}>Optimisez votre CV pour ce poste</h4>
                    <p className={styles.ctaDesc}>
                      L'IA a identifié des axes d'amélioration. Générez un CV sur mesure, optimisé ATS,
                      spécifiquement adapté à cette offre d'emploi.
                    </p>
                    <button className={styles.ctaBtn}>
                      {ICONS.fileEdit} Générer un CV optimisé
                    </button>
                  </div>
                  <div className={`${styles.ctaCard} ${styles.dark}`}>
                    <div className={styles.ctaIcon}>{ICONS.mic}</div>
                    <h4 className={styles.ctaTitle}>Prêt pour l'entretien ?</h4>
                    <p className={styles.ctaDesc}>
                      Passez à l'étape suivante : simulez votre entretien d'embauche pour ce poste avec notre IA.
                      Entraînez-vous dans des conditions réelles et recevez un feedback détaillé.
                    </p>
                    <button className={`${styles.ctaBtn} ${styles.outline}`}>
                      {ICONS.spark} Simuler l'entretien
                    </button>
                  </div>
                </div>

                {/* Nouvelle analyse */}
                <button className={styles.newAnalyseBtn} onClick={handleReset}>
                  Nouvelle analyse
                </button>

              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}