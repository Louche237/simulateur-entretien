import { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./CVBuilder.module.css";
import { fakeExtractCV, generateAdaptedCV, getOfferInsights } from "../../utils/cvLocal";
import { cvAPI } from "../../utils/api";
import { getPreferredLanguage } from "../../utils/preferences";
import DynamicSection from "./DynamicSection";
import CvPreview from "./CvPreview";
import { analyseCV } from "../../utils/cvAI";
import { ICONS } from "../../utils/icons";
import html2pdf from "html2pdf.js";

const COLORS = ["#7c3aed", "#2563eb", "#16a34a", "#dc2626", "#ea580c", "#1e293b"];
const TEMPLATES = ["Classique", "Minimal", "Moderne"];

function Section({ icon, label, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.sectionBlock}>
      <div className={styles.sectionHead} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionHeadLeft}>
          <span className={styles.sectionIcon}>{ICONS[icon]}</span>
          <span className={styles.sectionLabel}>
            {label}{count !== undefined ? ` (${count})` : ""}
          </span>
        </span>
        {open ? ICONS.chevUp : ICONS.chevDown}
      </div>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export default function CVBuilder() {
  const langue = getPreferredLanguage();
  const [tab, setTab] = useState("profil");
  const [color, setColor] = useState(COLORS[0]);
  const [fontSize, setFontSize] = useState("normal");
  const [template, setTemplate] = useState("Classique");
  const [offre, setOffre] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    tel: "",
    localisation: "",
    linkedin: "",
    titre: "",
    resume: "",
  });
  const [cvData, setCvData] = useState(null);
  const [adaptation, setAdaptation] = useState(null);
  const [offerInsights, setOfferInsights] = useState(null);
  const [photoName, setPhotoName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const cvFileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const previewRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      previewRef.current?.requestFullscreen().catch(err => {
        console.log(err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // New dynamic sections state
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [interests, setInterests] = useState([]);

  const filled = Object.values(form).filter(Boolean).length;
  const total = Object.keys(form).length;
  const pct = Math.round((filled / total) * 100);

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleImportFile = async (file) => {
    if (!file) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      alert("Format non accepté. PDF, DOC ou DOCX uniquement.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Fichier trop volumineux. Max 10MB.");
      return;
    }
    const remote = await cvAPI.extraire(file, { langue });
    const extracted = remote.success && remote.cvData ? remote.cvData : await fakeExtractCV(file);
    setCvData(extracted);
    setForm((prev) => ({
      ...prev,
      titre: extracted.title || prev.titre,
      resume: extracted.summary || prev.resume,
    }));
    setAdaptation(null);
  };

  const handleGenerate = async () => {
    if (offre.length < 50) return;
    setLoading(true);
    setAdaptation(null);
    const source = cvData || { skills: [], summary: form.resume, experiences, education, skills, languages, certifications, projects, interests };
    // Call AI analysis utility (could be backend)
    const result = await analyseCV(source, offre);
    if (result && result.adapted) {
      setAdaptation(result.adapted);
      setOfferInsights(result.offerInsights || getOfferInsights(offre));
    } else {
      // fallback simple generation
      const adapted = generateAdaptedCV(source, offre);
      setAdaptation(adapted);
      setOfferInsights(getOfferInsights(offre));
    }
    setLoading(false);
  };

  const handleImportClick = () => {
    cvFileInputRef.current?.click();
  };

  const handlePhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const url = URL.createObjectURL(file);
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  // Voice input for résumé (Web Speech API)
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.lang = langue === "fr" ? "fr-FR" : "en-US";
    recog.interimResults = false;
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setForm((p) => ({ ...p, resume: p.resume + " " + transcript }));
    };
    recog.onend = () => setListening(false);
    recognitionRef.current = recog;
  }, [langue]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  // PDF export using html2pdf
  const generatePDF = () => {
    const element = document.querySelector(`.${styles.previewDoc}`);
    if (!element) {
      alert("Veuillez d'abord créer un CV pour pouvoir l'exporter.");
      return;
    }

    const opt = {
      margin: 10,
      filename: `${form.nom || "cv"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.main}>
        {/* TOPBAR */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.topbarIc}>{ICONS.folder}</div>
            <div>
              <h1>CV Builder</h1>
              <p>Importez un CV ou remplissez manuellement</p>
            </div>
          </div>
          <div>
            <button type="button" className={styles.btnSave} onClick={handleImportClick}>
              {ICONS.upload} Importer un CV existant
            </button>
            <input
              id="cv-builder-file"
              type="file"
              accept=".pdf,.doc,.docx"
              className={styles.fileInput}
              ref={cvFileInputRef}
              style={{ display: "none" }}
              onChange={(e) => handleImportFile(e.target.files[0])}
            />
            {cvData && (
              <p className={styles.importNotice}>CV importé : {cvData.rawName || "CV simulé"}</p>
            )}
          </div>
        </div>

        <div className={styles.body}>
          {/* LEFT COLUMN – FORM */}
          <div className={styles.formCol}>
            {/* TABS */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === "profil" ? styles.tabActive : ""}`}
                onClick={() => setTab("profil")}
              >
                <span className={styles.tabNum}>1</span> Profil
              </button>
              <button
                className={`${styles.tab} ${tab === "offre" ? styles.tabActive : ""}`}
                onClick={() => setTab("offre")}
              >
                <span className={styles.tabNum}>2</span> Offre
              </button>
            </div>

            {tab === "profil" && (
              <div className={styles.formContent}>
                {/* PROGRESSION */}
                <div className={styles.progressCard}>
                  <div className={styles.progressTop}>
                    <span>Profil complété</span>
                    <span className={styles.progressPct}>{pct}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  {pct < 100 && (
                    <p className={styles.progressHint}>
                      Manque :{!form.nom && " Nom complet, "}{!form.email && " Email "}{filled < 3 && "+5"}
                    </p>
                  )}
                </div>

                {/* IMPORT CV */}
                <div>
                  <button type="button" className={styles.btnImport} onClick={handleImportClick}>
                    {ICONS.upload} Importer un CV existant (PDF, DOCX)
                  </button>
                </div>

                {/* PERSONAL INFORMATION */}
                <Section icon="user" label="Informations personnelles" defaultOpen>
                  <div className={styles.photoRow}>
                    <div className={styles.photoPlaceholder}>{ICONS.photo}</div>
                    <div>
                      <input
                        type="file"
                        ref={photoInputRef}
                        accept=".jpeg,.jpg,.png,image/jpeg,image/png"
                        style={{ display: "none" }}
                        onChange={handlePhotoChange}
                      />
                      <button type="button" className={styles.btnPhoto} onClick={handlePhotoClick}>
                        {ICONS.upload} Ajouter une photo
                      </button>
                      <p className={styles.photoHint}>Format JPG ou PNG. Max 2 Mo.</p>
                      {photoName && <p className={styles.photoHint}>Photo sélectionnée : {photoName}</p>}
                    </div>
                  </div>
                  <div className={styles.fieldFull}>
                    <label>Nom complet</label>
                    <input name="nom" className={styles.input} placeholder="Hugues Noel" value={form.nom} onChange={change} />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label>Email</label>
                      <input name="email" type="email" className={styles.input} placeholder="noel@email.com" value={form.email} onChange={change} />
                    </div>
                    <div className={styles.field}>
                      <label>Téléphone</label>
                      <input name="tel" className={styles.input} placeholder="+33 6 12 34 56 78" value={form.tel} onChange={change} />
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label>Localisation</label>
                      <input name="localisation" className={styles.input} placeholder="Yaoundé, Cameroun" value={form.localisation} onChange={change} />
                    </div>
                    <div className={styles.field}>
                      <label>LinkedIn</label>
                      <input name="linkedin" className={styles.input} placeholder="linkedin.com/in/..." value={form.linkedin} onChange={change} />
                    </div>
                  </div>
                  <div className={styles.fieldFull}>
                    <label>Titre professionnel</label>
                    <input name="titre" className={styles.input} placeholder="Développeur Full-Stack Senior" value={form.titre} onChange={change} />
                  </div>
                </Section>

                {/* SUMMARY */}
                <Section icon="spark" label="Résumé professionnel">
                  <div className={styles.fieldFull}>
                    <div className={styles.labelRow}>
                      <label>Résumé / Profil</label>
                      <span className={styles.iaBtn} onClick={toggleListening}>{ICONS.mic} {listening ? "Enregistrement..." : "Voix"}</span>
                    </div>
                    <textarea
                      name="resume"
                      className={styles.textarea}
                      rows={4}
                      placeholder="Résumez votre profil, vos compétences clés et votre valeur ajoutée en 3-4 phrases..."
                      value={form.resume}
                      onChange={change}
                    />
                  </div>
                </Section>

                {/* DYNAMIC SECTIONS */}
                <DynamicSection
                  icon="brief"
                  label="Expériences professionnelles"
                  items={experiences}
                  setItems={setExperiences}
                  fields={[
                    { name: "poste", placeholder: "Intitulé du poste" },
                    { name: "entreprise", placeholder: "Entreprise" },
                    { name: "dates", placeholder: "Dates (ex: 2020‑2022)" },
                    { name: "description", placeholder: "Description" },
                  ]}
                />
                <DynamicSection
                  icon="grad"
                  label="Formation"
                  items={education}
                  setItems={setEducation}
                  fields={[
                    { name: "diplome", placeholder: "Diplôme" },
                    { name: "etablissement", placeholder: "Établissement" },
                    { name: "dates", placeholder: "Dates" },
                  ]}
                />
                <DynamicSection
                  icon="code"
                  label="Compétences"
                  items={skills}
                  setItems={setSkills}
                  fields={[{ name: "skill", placeholder: "Compétence" }]}
                />
                <DynamicSection
                  icon="globe"
                  label="Langues"
                  items={languages}
                  setItems={setLanguages}
                  fields={[{ name: "langue", placeholder: "Langue" }, { name: "niveau", placeholder: "Niveau (ex: C1)" }]}
                />
                <DynamicSection
                  icon="award"
                  label="Certifications"
                  items={certifications}
                  setItems={setCertifications}
                  fields={[{ name: "titre", placeholder: "Titre" }, { name: "organisme", placeholder: "Organisme" }, { name: "date", placeholder: "Date" }]}
                />
                <DynamicSection
                  icon="folder"
                  label="Projets"
                  items={projects}
                  setItems={setProjects}
                  fields={[{ name: "nom", placeholder: "Nom du projet" }, { name: "description", placeholder: "Description" }, { name: "lien", placeholder: "Lien (URL)" }]}
                />
                <DynamicSection
                  icon="heart"
                  label="Centres d'intérêt"
                  items={interests}
                  setItems={setInterests}
                  fields={[{ name: "interest", placeholder: "Intérêt" }]}
                />
              </div>
            )}

            {tab === "offre" && (
              <div className={styles.formContent}>
                <div className={styles.offreSection}>
                  <div className={styles.offreNum}>2</div>
                  <div>
                    <h3>Offre d'emploi cible</h3>
                    <p>Collez la description du poste visé. L'IA adaptera votre CV pour maximiser vos chances.</p>
                  </div>
                </div>
                <textarea
                  className={styles.textarea}
                  rows={10}
                  placeholder="Collez ici l'intégralité de l'offre d'emploi : titre du poste, missions, compétences requises, profil recherché..."
                  value={offre}
                  onChange={(e) => {
                    setOffre(e.target.value);
                    setOfferInsights(getOfferInsights(e.target.value));
                  }}
                />
                {offerInsights && offerInsights.keywords.length > 0 && (
                  <div className={styles.offerInsights}>
                    <span>Mots‑clés détectés :</span>
                    <div className={styles.tags}>
                      {offerInsights.keywords.map((keyword) => (
                        <span key={keyword} className={styles.tag}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className={styles.offreHint}>Minimum 50 caractères</p>
                <button
                  className={`${styles.btnGenerer} ${offre.length < 50 || loading ? styles.btnDisabled : ""}`}
                  disabled={offre.length < 50 || loading}
                  onClick={handleGenerate}
                >
                  {loading ? "Génération en cours..." : <>{ICONS.spark} Générer mon CV sur mesure</>}
                  <span className={styles.badge}>2/2</span>
                </button>
                {adaptation && (
                  <div className={styles.analysisCard}>
                    <h4>Suggestion de CV adapté</h4>
                    <p>{adaptation.adaptedSummary}</p>
                    <div className={styles.tags}>
                      {adaptation.highlightedSkills.map((skill) => (
                        <span key={skill} className={styles.tag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Score badge */}
                {adaptation && adaptation.score !== undefined && (
                  <div className={styles.analysisCard}>
                    <h4>Score IA du CV</h4>
                    <p>{adaptation.score} / 100</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RESIZER */}
          <div className={styles.resizer}>⠿</div>

          {/* RIGHT COLUMN — PREVIEW */}
          <div className={styles.previewCol} ref={previewRef}>
            {/* TOOLBAR PREVIEW */}
            <div className={styles.previewToolbar}>
              <select className={styles.templateSelect} value={template} onChange={(e) => setTemplate(e.target.value)}>
                {TEMPLATES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>

              <div className={styles.colorPicker}>
                {COLORS.map((c) => (
                  <div
                    key={c}
                    className={`${styles.colorDot} ${color === c ? styles.colorActive : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>

              <div className={styles.fontSizes}>
                {["small", "normal", "large"].map((s, i) => (
                  <button
                    key={s}
                    className={`${styles.fontBtn} ${fontSize === s ? styles.fontActive : ""}`}
                    style={{ fontSize: 12 + i * 2 }}
                    onClick={() => setFontSize(s)}
                  >
                    A
                  </button>
                ))}
                <span className={styles.fontLabel}>Normal</span>
              </div>

              <button className={styles.btnPdf} onClick={generatePDF}>
                {ICONS.pdf} PDF
              </button>
              <button className={styles.btnFullscreen} onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 9H4v5H3V4h5v5zm6-5h-5v5h5V4zM3 15h-5v5h5v-5h-5zm15-5h5v5h-5v-5h5z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M8 3H5a2 2 0 00-2 2v3M8 3v5H3v-5zM21 3h-5v5h5V5a2 2 0 00-2-2zM3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3M21 8v5h-5v5h5z"/>
                  </svg>
                )}
                {isFullscreen ? "Quitter plein écran" : "Plein écran"}
              </button>
            </div>

            {/* PREVIEW */}
            <div className={`${styles.previewArea} ${isFullscreen ? styles.previewAreaFullscreen : ""}`}>
              {!form.nom && !form.titre && !photoUrl ? (
                <div className={styles.previewEmpty}>
                  {ICONS.doc}
                  <p className={styles.previewEmptyTitle}>Aperçu en temps réel</p>
                  <p className={styles.previewEmptySub}>Remplissez le formulaire à gauche ou importez un CV pour voir l'aperçu ici.</p>
                </div>
              ) : (
                <CvPreview
                  template={template}
                  color={color}
                  fontSize={fontSize}
                  form={form}
                  adaptation={adaptation}
                  photoUrl={photoUrl}
                  experiences={experiences}
                  education={education}
                  skills={skills}
                  languages={languages}
                  certifications={certifications}
                  projects={projects}
                  interests={interests}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
