import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  CalendarDays,
  RefreshCw,
  CalendarCheck,
  Mic,
  Laptop,
  Landmark,
  Briefcase,
  ShoppingBag,
  HeartPulse,
  Factory,
  Clapperboard,
  Building2,
  Sparkles,
  Flame,
  Coins,
  TrendingDown,
  TrendingUp,
  Brain,
  Scale,
  Rocket,
  Cpu,
  Check,
  Zap,
  BookOpen,
  X,
  Star,
  Dumbbell,
  Clock,
  Play,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Compass,
  RotateCcw,
  BarChart3,
  Lock,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  createLocalSession,
  getLocalSessions,
  getAllCompetencesProgress,
  createCompetenceSession,
  createSpecificQuestionSession
} from "../../utils/localSessions";
import { getPreferredLanguage } from "../../utils/preferences";
import styles from "./Entrainements.module.css";

// ─── HELPERS POUR LE GRAPH D'ÉVOLUTION ──────────────────────────
const getEvolutionData = (sessions) => {
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    
    const daySessions = sessions.filter((s) => s.finishedAt && s.finishedAt.slice(0, 10) === dayStr);
    
    let avgScore = 0;
    if (daySessions.length > 0) {
      const sum = daySessions.reduce((acc, s) => acc + (s.score || 0), 0);
      avgScore = Math.round(sum / daySessions.length);
    }
    
    data.push({
      dateStr: dayStr,
      displayDate: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      score: avgScore,
      count: daySessions.length,
    });
  }
  
  return data;
};

function EvolutionChart({ sessions }) {
  const data = useMemo(() => getEvolutionData(sessions), [sessions]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const finishedWithScore = sessions.filter((s) => s.score !== null);
  const globalAvg = finishedWithScore.length
    ? Math.round(finishedWithScore.reduce((sum, s) => sum + (s.score || 0), 0) / finishedWithScore.length)
    : 0;

  const width = 600;
  const height = 140;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;
  
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const barSpacing = plotWidth / 30;
  const barWidth = Math.max(6, barSpacing - 6);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>
        <span className={styles.chartTitleLabel}>
          <BarChart3 size={16} className={styles.chartTitleIcon} /> Progression sur les 30 derniers jours
        </span>
        {globalAvg > 0 && <span className={styles.globalAvgBadge}>Moyenne globale : {globalAvg}%</span>}
      </div>
      
      <div className={styles.svgWrapper}>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
          {/* Y Axis Grid Lines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = paddingTop + plotHeight - (tick / 100) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#9ca3af"
                >
                  {tick}%
                </text>
              </g>
            );
          })}
          
          {/* Global Average Line */}
          {globalAvg > 0 && (
            <line
              x1={paddingLeft}
              y1={paddingTop + plotHeight - (globalAvg / 100) * plotHeight}
              x2={width - paddingRight}
              y2={paddingTop + plotHeight - (globalAvg / 100) * plotHeight}
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.75"
            />
          )}

          {/* Bars */}
          {data.map((d, i) => {
            if (d.count === 0) return null;
            
            const barHeight = Math.max(6, (d.score / 100) * plotHeight);
            const x = paddingLeft + i * barSpacing + (barSpacing - barWidth) / 2;
            const y = paddingTop + plotHeight - barHeight;
            
            const color = d.score >= 70 ? "#2563eb" : d.score >= 50 ? "#f97316" : "#9ca3af";
            
            return (
              <g
                key={d.dateStr}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={paddingLeft + i * barSpacing}
                  y={paddingTop}
                  width={barSpacing}
                  height={plotHeight}
                  fill="transparent"
                />
                
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="2"
                  fill={color}
                  opacity={hoveredIndex === i ? 1 : 0.8}
                  style={{ transition: "all 0.15s" }}
                />
              </g>
            );
          })}
          
          {/* X Axis Labels */}
          {data.map((d, i) => {
            if (i % 6 !== 0 && i !== 29) return null;
            
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = height - 5;
            
            return (
              <text
                key={d.dateStr}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
              >
                {d.displayDate}
              </text>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className={styles.tooltip}
            style={{
              left: `${paddingLeft + hoveredIndex * barSpacing + barSpacing / 2}px`,
              top: `${paddingTop + plotHeight - (data[hoveredIndex].score / 100) * plotHeight - 10}px`,
            }}
          >
            <strong>{data[hoveredIndex].displayDate}</strong>
            <span>Score : {data[hoveredIndex].score}%</span>
            <span>{data[hoveredIndex].count} session(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}

const ICONS = {
  grid: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  mic: <Mic size={16} />,
  dumbbell: <Dumbbell size={16} />,
  file: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  layout: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  history: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  card: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  settings: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  user: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  play: <Play size={14} fill="currentColor" stroke="none" />,
  spark: <Sparkles size={14} />,
  flame: <Flame size={14} />,
  lock: <Lock size={14} />,
  clock: <Clock size={14} />,
  x: <X size={14} />,
  arrow: <ArrowRight size={14} />,
  arrowL: <ArrowLeft size={14} />,
};

const renderStars = (starsCount, max = 5) => (
  <span className={styles.starsRow}>
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        size={12}
        className={i < starsCount ? styles.starFilled : styles.starEmpty}
      />
    ))}
  </span>
);

const SUGGESTIONS_POSTES = ["Product Manager","Chef de projet","Développeur Full-Stack","Data Analyst","Consultant","Business Developer","UX/UI Designer","Marketing Manager"];
const OBJECTIFS = [
  { id: "job", icon: <Target size={20} />, label: "Décrocher mon premier job", sub: "Premier vrai poste" },
  { id: "prep", icon: <CalendarDays size={20} />, label: "Préparer mes futurs entretiens", sub: "Plusieurs entretiens à venir" },
  { id: "reconv", icon: <RefreshCw size={20} />, label: "Me reconvertir", sub: "Changer de métier ou secteur" },
  { id: "precis", icon: <CalendarCheck size={20} />, label: "Préparer un entretien précis", sub: "Échéance imminente" },
  { id: "oral", icon: <Mic size={20} />, label: "Progresser en aisance orale", sub: "Être plus à l'aise" },
];
const SECTEURS = [
  { id: "tech", icon: <Laptop size={17} />, label: "Tech / SaaS" },
  { id: "finance", icon: <Landmark size={17} />, label: "Finance / Banque" },
  { id: "conseil", icon: <Briefcase size={17} />, label: "Conseil" },
  { id: "retail", icon: <ShoppingBag size={17} />, label: "Retail / E-commerce" },
  { id: "sante", icon: <HeartPulse size={17} />, label: "Santé / Pharma" },
  { id: "industrie", icon: <Factory size={17} />, label: "Industrie" },
  { id: "media", icon: <Clapperboard size={17} />, label: "Média / Pub" },
  { id: "public", icon: <Building2 size={17} />, label: "Public / ONG" },
];
const SUGGESTIONS_SKILLS = ["Leadership","Communication","Négociation","Gestion de projet","Esprit d'analyse","Créativité","Travail en équipe","Gestion du stress","Anglais","Prise de parole"];
const COMPETENCES = [
  { id: "pitch", icon: <Mic size={18} />, label: "Pitch perso", sub: "Se présenter en 60-90s, parcou...", q: 4 },
  { id: "star", icon: <Sparkles size={18} />, label: "Storytelling STAR", sub: "Raconter une expérience avec la...", q: 5 },
  { id: "motiv", icon: <Flame size={18} />, label: "Motivation & sens", sub: "Pourquoi ce poste, cette...", q: 4 },
  { id: "nego", icon: <Coins size={18} />, label: "Négociation salaire", sub: "Salaire, package, contre-offre,...", q: 5 },
  { id: "echec", icon: <TrendingDown size={18} />, label: "Parler d'un échec", sub: "Vrai échec passé et leçon apprise", q: 4 },
  { id: "stress", icon: <Brain size={18} />, label: "Gestion du stress", sub: "Questions pièges, faiblesses,...", q: 4 },
  { id: "conflit", icon: <Scale size={18} />, label: "Gestion de conflit", sub: "Conflit interpersonnel (collègue,...", q: 4 },
  { id: "leader", icon: <Rocket size={18} />, label: "Leadership & influence", sub: "Mobiliser, décider, embarquer,...", q: 4 },
  { id: "tech", icon: <Cpu size={18} />, label: "Technique métier", sub: "Vulgariser et démontrer sa...", q: 6 },
];

const TRAINING_PROFILE_KEY = "jobmentor.trainingProfile";
const TRAINING_MODAL_KEY = "jobmentor.trainingModalSeen";

const getScopedKey = (baseKey) => {
  try {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      const userIdent = user.id || user.email;
      if (userIdent) {
        return `${baseKey}_${userIdent}`;
      }
    }
  } catch {
    // ignore
  }
  return baseKey;
};

const getStoredTrainingProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(getScopedKey(TRAINING_PROFILE_KEY)) || "null");
  } catch {
    return null;
  }
};

const saveTrainingProfile = (profile) => {
  localStorage.setItem(getScopedKey(TRAINING_PROFILE_KEY), JSON.stringify(profile));
};

const buildDailyQuestions = (profile) => {
  const target = profile.postes?.[0] || "le poste visé";
  const skills = profile.skills?.slice(0, 3) || [];
  const skillText = skills.length ? skills.join(", ") : "vos compétences clés";

  return [
    `Présente-toi en 90 secondes pour un poste de ${target}.`,
    `Donne un exemple concret qui démontre: ${skillText}.`,
    "Raconte une expérience avec la méthode STAR: situation, tâche, action, résultat.",
    "Le recruteur te relance: pourquoi es-tu vraiment motivé pour ce poste ?",
  ];
};

// ─── SETUP WIZARD ───────────────────────────────────────────────
function SetupWizard({ onFinish }) {
  const [step, setStep] = useState(1);
  const [postes, setPostes] = useState([]);
  const [posteInput, setPosteInput] = useState("");
  const [objectif, setObjectif] = useState("");
  const [secteur, setSecteur] = useState("");
  const [autreSecteur, setAutreSecteur] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [salaire, setSalaire] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  const GEN_STEPS = [
    { label: "Analyse de ton profil", sub: "On lit tes postes ciblés, ton niveau, tes compétences clés..." },
    { label: "Sélection des angles", sub: "On identifie les angles de questions pertinents..." },
    { label: "Création des questions", sub: "On génère tes questions personnalisées..." },
    { label: "Rédaction des réponses modèles", sub: "On prépare les réponses modèles..." },
  ];

  const addPoste = (p) => {
    if (postes.length >= 5 || !p.trim()) return;
    if (!postes.includes(p.trim())) setPostes([...postes, p.trim()]);
    setPosteInput("");
  };

  const addSkill = (s) => {
    if (skills.length >= 8 || !s.trim()) return;
    if (!skills.includes(s.trim())) setSkills([...skills, s.trim()]);
    setSkillInput("");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(i);
      await new Promise((r) => setTimeout(r, 1500));
    }
    await new Promise((r) => setTimeout(r, 500));
    onFinish({
      postes,
      objectif,
      secteur: autreSecteur.trim() || secteur,
      skills,
      salaire,
      createdAt: new Date().toISOString(),
    });
  };

  if (generating) {
    return (
      <div className={styles.genScreen}>
        <div className={styles.genIcon}><Sparkles size={40} /></div>
        <h2>Création de ta bibliothèque...</h2>
        <p>~15 secondes. On génère ~36 questions personnalisées à ton profil.</p>
        <div className={styles.genSteps}>
          {GEN_STEPS.map((s, i) => (
            <div key={i} className={`${styles.genStep} ${i === genStep ? styles.genStepActive : ""} ${i < genStep ? styles.genStepDone : ""}`}>
              <div className={styles.genStepIc}>
                {i < genStep ? <Check size={14} strokeWidth={2.5} /> : i === genStep ? <span className={styles.genSpinner}/> : <span className={styles.genStepBullet} />}
              </div>
              <div>
                <div className={styles.genStepLabel}>{s.label}</div>
                {i === genStep && <div className={styles.genStepSub}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>
        <p className={styles.genTimer}>3s écoulées · ne ferme pas la page</p>
      </div>
    );
  }

  return (
    <div className={styles.wizard}>
      {/* PROGRESS BAR */}
      <div className={styles.wizardTop}>
        <div className={styles.wizardLabel}>CONFIGURATION DE TON ENTRAÎNEMENT</div>
        <div className={styles.wizardBar}>
          {[1,2,3,4].map((i) => (
            <div key={i} className={`${styles.wizardBarSeg} ${step >= i ? styles.wizardBarActive : ""}`}/>
          ))}
        </div>
      </div>

      {/* ÉTAPE 1 — POSTES */}
      {step === 1 && (
        <div className={styles.wizardStep}>
          <div className={styles.wizardEmoji}><Target size={32} /></div>
          <h2>Quels postes vises-tu ?</h2>
          <p>Ajoute jusqu'à 5 intitulés. Tape Entrée pour valider.</p>
          <div className={styles.tagInput}>
            {postes.map((p) => (
              <span key={p} className={styles.tag}>{p}
                <button onClick={() => setPostes(postes.filter((x) => x !== p))}>×</button>
              </span>
            ))}
            <input
              placeholder="Ex: Product Manager..."
              value={posteInput}
              onChange={(e) => setPosteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPoste(posteInput)}
            />
          </div>
          <div className={styles.suggestions}>
            <span>Suggestions populaires :</span>
            {SUGGESTIONS_POSTES.map((s) => (
              <button key={s} className={styles.suggBtn} onClick={() => addPoste(s)}>+ {s}</button>
            ))}
          </div>
          <div className={styles.wizardNav}>
            <span className={styles.etape}>Étape 1 sur 4</span>
            <button className={`${styles.btnContinue} ${postes.length === 0 ? styles.btnDisabled : ""}`}
              disabled={postes.length === 0} onClick={() => setStep(2)}>
              Continuer {ICONS.arrow}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — OBJECTIF */}
      {step === 2 && (
        <div className={styles.wizardStep}>
          <div className={styles.wizardEmoji}><Compass size={32} /></div>
          <h2>Ton objectif principal ?</h2>
          <p>Pour personnaliser tes scénarios.</p>
          <div className={styles.objectifList}>
            {OBJECTIFS.map((o) => (
              <div key={o.id}
                className={`${styles.objectifItem} ${objectif === o.id ? styles.objectifActive : ""}`}
                onClick={() => { setObjectif(o.id); setTimeout(() => setStep(3), 300); }}>
                <span className={styles.objectifEmoji}>{o.icon}</span>
                <div>
                  <div className={styles.objectifLabel}>{o.label}</div>
                  <div className={styles.objectifSub}>{o.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.wizardNav}>
            <button className={styles.btnBack} onClick={() => setStep(1)}>{ICONS.arrowL} Retour</button>
            <span className={styles.etape}>Étape 2 sur 4</span>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — SECTEUR */}
      {step === 3 && (
        <div className={styles.wizardStep}>
          <div className={styles.wizardEmoji}><Building2 size={32} /></div>
          <h2>Dans quel secteur ?</h2>
          <p>On colore tes mises en situation.</p>
          <div className={styles.secteurGrid}>
            {SECTEURS.map((s) => (
              <div key={s.id}
                className={`${styles.secteurItem} ${secteur === s.id ? styles.secteurActive : ""}`}
                onClick={() => setSecteur(s.id)}>
                <span className={styles.secteurIcon}>{s.icon}</span> {s.label}
              </div>
            ))}
          </div>
          <div className={styles.autreSecteur}>
            <label>Autre secteur ?</label>
            <input className={styles.input} placeholder="Ex: Édition, Sport, Énergie..."
              value={autreSecteur} onChange={(e) => setAutreSecteur(e.target.value)} />
          </div>
          <div className={styles.wizardNav}>
            <button className={styles.btnBack} onClick={() => setStep(2)}>{ICONS.arrowL} Retour</button>
            <span className={styles.etape}>Étape 3 sur 4</span>
            <button className={`${styles.btnContinue} ${!secteur && !autreSecteur ? styles.btnDisabled : ""}`}
              disabled={!secteur && !autreSecteur} onClick={() => setStep(4)}>
              Continuer {ICONS.arrow}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 4 — COMPÉTENCES */}
      {step === 4 && (
        <div className={styles.wizardStep}>
          <div className={styles.wizardEmoji}><Zap size={32} /></div>
          <h2>Tes compétences clés</h2>
          <p>Celles que tu veux mettre en avant. 2 à 8.</p>
          <div className={styles.tagInput}>
            {skills.map((s) => (
              <span key={s} className={styles.tag}>{s}
                <button onClick={() => setSkills(skills.filter((x) => x !== s))}>×</button>
              </span>
            ))}
            <input placeholder="Ex: Leadership..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill(skillInput)} />
          </div>
          <div className={styles.suggestions}>
            <span>Suggestions :</span>
            {SUGGESTIONS_SKILLS.map((s) => (
              <button key={s} className={styles.suggBtn} onClick={() => addSkill(s)}>+ {s}</button>
            ))}
          </div>
          <div className={styles.field}>
            <label>Fourchette salariale visée <span className={styles.optional}>(optionnel)</span></label>
            <input className={styles.input} placeholder="Ex: 45-55k fcfa brut annuel"
              value={salaire} onChange={(e) => setSalaire(e.target.value)} />
            <p className={styles.hint}>Sert à générer des questions de négociation salariale réalistes.</p>
          </div>
          <div className={styles.pret}>
            <span>{ICONS.spark}</span>
            <div>
              <strong>Prêt ?</strong>
              <p>On va générer ~40 questions personnalisées (≈30 secondes).</p>
            </div>
          </div>
          <div className={styles.wizardNav}>
            <button className={styles.btnBack} onClick={() => setStep(3)}>{ICONS.arrowL} Retour</button>
            <span className={styles.etape}>Étape 4 sur 4</span>
            <button className={`${styles.btnGenerate} ${skills.length < 2 ? styles.btnDisabled : ""}`}
              disabled={skills.length < 2} onClick={handleGenerate}>
              {ICONS.spark} Générer ma bibliothèque
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ENTRAÎNEMENTS ───────────────────────────────────
function EntrainementsDashboard({ profile, onReset }) {
  const sessions = getLocalSessions();
  const trainingSessions = sessions.filter(
    (session) => session.source === "entrainement" || session.source === "competence" || session.source === "question_specifique"
  );
  const finishedTraining = trainingSessions.filter((session) => session.status === "terminee");
  const activeTraining = trainingSessions.find((session) => session.status === "en_cours");
  const doneToday = trainingSessions.some((session) => {
    const today = new Date().toISOString().slice(0, 10);
    return session.createdAt?.slice(0, 10) === today && session.status === "terminee";
  });
  const totalQuestions = finishedTraining.reduce((sum, session) => sum + session.questions.length, 0);
  const averageScore = finishedTraining.length
    ? Math.round(finishedTraining.reduce((sum, session) => sum + (session.score || 0), 0) / finishedTraining.length)
    : 0;
  const level = Math.max(1, Math.floor(totalQuestions / 12) + 1);
  const levelProgress = Math.min(100, Math.round(((totalQuestions % 12) / 12) * 100));
  const streak = finishedTraining.length;
  
  const [showModal, setShowModal] = useState(() => !localStorage.getItem(getScopedKey(TRAINING_MODAL_KEY)));
  const [modalStep, setModalStep] = useState(1);
  const [showAskModal, setShowAskModal] = useState(false);
  const [showLibModal, setShowLibModal] = useState(false);
  const [specificQuestion, setSpecificQuestion] = useState("");
  
  const navigate = useNavigate();

  const competencesProgress = getAllCompetencesProgress();

  const MODAL_SLIDES = [
    {
      icon: <Zap size={28} strokeWidth={2} />,
      title: "Ton entraînement du jour, en 10 minutes",
      text: "Chaque jour, ton coach IA te prépare 4 questions ciblées : révisions de tes points faibles + nouveautés. Tu réponds à l'oral, l'IA te score et te montre la version modèle. C'est ton vrai cardio d'entretien.",
    },
    {
      icon: <TrendingUp size={28} strokeWidth={2} />,
      title: "Suis ta progression",
      text: "Ton radar de compétences se met à jour après chaque session. Tu vois exactement où tu progresses et ce qu'il reste à travailler.",
    },
  ];

  // Radar simplifié SVG
  const radarLabels = ["Pitch perso","Storytelling STAR","Motivation & sens","Négociation salaire","Parler d'un échec","Gestion du stress","Gestion de conflit","Leadership & influence","Technique métier"];
  const N = radarLabels.length;
  const cx = 120; const cy = 120; const r = 90;
  const getPoint = (i, val) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return { x: cx + val * r * Math.cos(angle), y: cy + val * r * Math.sin(angle) };
  };
  const gridPoints = (val) => radarLabels.map((_, i) => getPoint(i, val));
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
  const radarValue = Math.min(1, averageScore / 100);

  const closeModal = () => {
    localStorage.setItem(getScopedKey(TRAINING_MODAL_KEY), "1");
    setShowModal(false);
  };

  const startDailyTraining = () => {
    const langue = getPreferredLanguage();

    if (activeTraining) {
      navigate("/entretien", { state: { sessionId: activeTraining.id } });
      return;
    }

    const session = createLocalSession({
      type: "entrainement",
      poste: profile.postes?.[0] || "Entraînement entretien",
      entreprise: "JobMentor",
      niveau: "intermediaire",
      difficulte: "normal",
      recruteur: "aria",
      surprises: false,
      duree: 10,
      langue,
      description: `Entraînement quotidien. Objectif: ${profile.objectif}. Secteur: ${profile.secteur}.`,
      questions: buildDailyQuestions(profile),
    });

    navigate("/entretien", { state: { sessionId: session.id } });
  };

  const handleStartCompetence = (competenceId, label) => {
    const session = createCompetenceSession(competenceId, profile, label);
    navigate("/entretien", { state: { sessionId: session.id } });
  };

  const handleAskSubmit = (e) => {
    e.preventDefault();
    if (!specificQuestion.trim()) return;
    const session = createSpecificQuestionSession(specificQuestion.trim(), profile);
    setShowAskModal(false);
    setSpecificQuestion("");
    navigate("/entretien", { state: { sessionId: session.id } });
  };

  return (
    <div className={styles.dashMain}>

      {/* MODAL BIENVENUE */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={closeModal} aria-label="Fermer"><X size={18} /></button>
            <div className={styles.modalIcon}>{MODAL_SLIDES[modalStep - 1].icon}</div>
            <h3>{MODAL_SLIDES[modalStep - 1].title}</h3>
            <p>{MODAL_SLIDES[modalStep - 1].text}</p>
            <div className={styles.modalDots}>
              {MODAL_SLIDES.map((_, i) => (
                <div key={i} className={`${styles.dot} ${modalStep === i + 1 ? styles.dotActive : ""}`} />
              ))}
            </div>
            <div className={styles.modalNav}>
              <button className={styles.btnPasser} onClick={closeModal}><X size={14} /> Passer</button>
              {modalStep < MODAL_SLIDES.length
                ? <button className={styles.btnSuivant} onClick={() => setModalStep(2)}>Suivant {ICONS.arrow}</button>
                : <button className={styles.btnSuivant} onClick={closeModal}>Commencer {ICONS.play}</button>
              }
            </div>
          </div>
        </div>
      )}

      {/* MODAL SPECIFIC QUESTION */}
      {showAskModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBoxCustom}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}><Mic size={18} className={styles.modalTitleIcon} /> Poser une question spécifique</h3>
                <p className={styles.modalSubtitle}>Saisissez une question personnalisée ou choisissez une suggestion ci-dessous.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowAskModal(false)} aria-label="Fermer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAskSubmit} className={styles.modalForm}>
              <textarea
                className={styles.modalTextarea}
                placeholder="Ex: Pourquoi pensez-vous être le candidat idéal pour ce poste ?"
                value={specificQuestion}
                onChange={(e) => setSpecificQuestion(e.target.value)}
                required
                rows={4}
              />
              
              <div className={styles.suggestionsBox}>
                <span>Suggestions rapides :</span>
                <div className={styles.suggestionsGrid}>
                  {[
                    "Parlez-moi d'une situation où vous avez dépassé vos objectifs.",
                    "Comment gérez-vous les conflits de priorités avec vos collègues ?",
                    "Décrivez votre style de management idéal.",
                    "Pourquoi voulez-vous quitter votre entreprise actuelle ?"
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      className={styles.suggestionItem}
                      onClick={() => setSpecificQuestion(sugg)}
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowAskModal(false)}>
                  Annuler
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={!specificQuestion.trim()}>
                  {ICONS.play} Lancer la session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPLETE LIBRARY */}
      {showLibModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBoxCustom}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}><BookOpen size={18} className={styles.modalTitleIcon} /> Compléter ma librairie</h3>
                <p className={styles.modalSubtitle}>Sélectionnez une compétence ci-dessous pour lancer un entraînement ciblé.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowLibModal(false)} aria-label="Fermer"><X size={18} /></button>
            </div>
            
            <div className={styles.modalBodyScroll}>
              <div className={styles.libGrid}>
                {COMPETENCES.map((c) => {
                  const prog = competencesProgress[c.id] || { stars: 0, sessions: 0, avgScore: 0, done: false };
                  return (
                    <div
                      key={c.id}
                      className={`${styles.libItem} ${prog.done ? styles.libItemDone : ""}`}
                      onClick={() => {
                        handleStartCompetence(c.id, c.label);
                        setShowLibModal(false);
                      }}
                    >
                      <div className={styles.libItemHeader}>
                        <span className={styles.libEmoji}>{c.icon}</span>
                        <div>
                          <strong>{c.label}</strong>
                          <span className={styles.libSub}>{c.sub}</span>
                        </div>
                      </div>
                      <div className={styles.libItemFooter}>
                        <span className={styles.libStars}>{renderStars(prog.stars)}</span>
                        {prog.done ? (
                          <span className={styles.libBadgeDone}><Check size={12} strokeWidth={2.5} /> Terminée</span>
                        ) : (
                          <span className={styles.libBadgeTodo}>À travailler ({prog.avgScore}%)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className={styles.dashHeader}>
        <div className={styles.dashHeaderLeft}>
          <div className={styles.dashHeaderIcon}>
            <Dumbbell size={24} strokeWidth={2} />
          </div>
          <div>
            <h1>Entraînements</h1>
            <p>10 minutes par jour, ton coach IA fait le reste.</p>
          </div>
        </div>
        
        <div className={styles.dashHeaderRight}>
          <div className={styles.streakBadgeHeader}>
            <Flame size={16} className={styles.flameIcon} />
            <span>{streak} jour{streak > 1 ? "s" : ""}</span>
          </div>
          
          <div className={styles.levelCardHeader}>
            <div className={styles.levelRow}>
              <span className={styles.levelNumberHeader}>Niveau {level}</span>
              <span className={styles.levelTitleHeader}>
                {level === 1 ? "Débutant" : level === 2 ? "Intermédiaire" : "Avancé"}
              </span>
            </div>
            
            <div className={styles.levelProgressHeader}>
              <div className={styles.levelProgressFillHeader} style={{ width: `${levelProgress}%` }} />
            </div>
            
            <div className={styles.levelHintHeader}>
              {levelProgress}% vers niveau {level + 1}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className={styles.dashGrid}>
        
        {/* COLONNE GAUCHE */}
        <div className={styles.leftCol}>
          
          {/* ENTRAÎNEMENT DU JOUR */}
          <div className={styles.jourCard}>
            <div className={styles.jourHeader}>
              <div className={styles.jourIc}><Zap size={24} strokeWidth={2} /></div>
              <div className={styles.jourHeaderText}>
                <h2>Entraînement du jour</h2>
                <p>4 questions ciblées par ton coach IA</p>
                <p className={styles.jourDesc}>
                  3 questions courtes (~90s chacune) + 1 mise en situation où le recruteur te relance.
                </p>
              </div>
            </div>
            
            <div className={styles.jourMeta}>
              <Clock size={14} className={styles.metaClockIcon} /> ~11 min · <span>{doneToday ? "4/4 faites" : activeTraining ? "0/4 faites" : "0/4 faites"}</span>
            </div>
            
            <div className={styles.jourProgress}>
              <div className={styles.jourFill} style={{ width: doneToday ? "100%" : activeTraining ? "50%" : "0%" }} />
            </div>
            
            <button className={styles.btnCommencer} onClick={startDailyTraining}>
              {ICONS.play} {activeTraining ? "Reprendre" : "Commencer maintenant"}
            </button>
          </div>

          {/* RÉGULARITÉ */}
          <div className={styles.regulariteCard}>
            <div className={styles.regulariteHeader}>
              <span className={styles.regulariteTitle}><Flame size={18} className={styles.flameIcon} /> Régularité</span>
              <div className={styles.regulariteBadges}>
                <span className={styles.activeDaysText}>0 j actifs</span>
                <span className={styles.streakBadge}><Flame size={13} className={styles.flameIcon} /> {streak}j</span>
              </div>
            </div>
            <EvolutionChart sessions={finishedTraining} />
          </div>
          
        </div>

        {/* COLONNE DROITE */}
        <div className={styles.rightCol}>
          
          {/* RADAR */}
          <div className={styles.radarCard}>
            <div className={styles.radarHeader}>
              <div className={styles.radarHeaderLeft}>
                <Sparkles size={16} className={styles.sparkleIcon} /> Ton profil de compétences
              </div>
              <div className={styles.radarPct}>
                <span>{averageScore}%</span>
                <small>progression moyenne</small>
              </div>
            </div>
            <div className={styles.radarWrap}>
              <svg viewBox="0 0 240 240" width="200" height="200">
                {[0.25, 0.5, 0.75, 1].map((v) => (
                  <path key={v} d={toPath(gridPoints(v))} fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                ))}
                {radarLabels.map((_, i) => {
                  const p = getPoint(i, 1);
                  return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1"/>;
                })}
                {radarLabels.map((lbl, i) => {
                  const p = getPoint(i, 1.18);
                  return <text key={i} x={p.x} y={p.y} textAnchor="middle" fontSize="7" fill="#6b7280">{lbl}</text>;
                })}
                <path d={toPath(gridPoints(radarValue))} fill="rgba(37,99,235,0.15)" stroke="#2563eb" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className={styles.radarLink}>Ton profil de compétences</p>
          </div>
          
        </div>

        {/* ACTIONS RAPIDES */}
        <div className={styles.actionsRow}>
          <button className={styles.actionBtn} onClick={() => setShowAskModal(true)}>
            <HelpCircle size={15} /> Demander une question spécifique
          </button>
          <button className={styles.actionBtn} onClick={() => setShowLibModal(true)}>
            <BookOpen size={15} /> Compléter ma librairie
          </button>
          <button className={styles.actionBtn} onClick={() => setShowModal(true)}>
            <Compass size={15} /> Revoir la visite guidée
          </button>
          <button className={styles.actionBtn} onClick={onReset}>
            <RotateCcw size={15} /> Régénérer ma bibliothèque
          </button>
        </div>

        {/* COMPÉTENCES */}
        <div className={styles.competencesSection}>
          <div className={styles.competencesHeader}>
            <h2>Tes compétences à travailler</h2>
            <span>9 compétences</span>
          </div>
          <div className={styles.competencesGrid}>
            {COMPETENCES.map((c) => {
              const prog = competencesProgress[c.id] || { stars: 0, sessions: 0, avgScore: 0, done: false };
              return (
                <div key={c.id} className={`${styles.competenceCard} ${prog.done ? styles.competenceDone : ""}`}>
                  <div className={styles.compHeader}>
                    <span className={styles.compEmoji}>{c.icon}</span>
                    <div className={styles.compInfo}>
                      <div className={styles.compLabel}>
                        {c.label}
                        {prog.done && <span className={styles.doneBadge}><Check size={11} strokeWidth={2.5} /> Terminée</span>}
                      </div>
                      <div className={styles.compSub}>{c.sub}</div>
                    </div>
                    <div className={styles.stars}>{renderStars(prog.stars)}</div>
                  </div>
                  <div className={styles.compFooter}>
                    <span>{c.q} questions</span>
                    <span>{Math.min(50, prog.sessions * 10)} / 50 XP</span>
                    <button className={styles.btnTrainComp} onClick={() => handleStartCompetence(c.id, c.label)}>
                      {ICONS.play} S'entraîner
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.totalQ}>{totalQuestions} / 40 questions travaillées</p>
        </div>

      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ───────────────────────────────────────────
export default function Entrainements() {
  const [profile, setProfile] = useState(() => getStoredTrainingProfile());

  const finishSetup = (nextProfile) => {
    saveTrainingProfile(nextProfile);
    setProfile(nextProfile);
  };

  const resetSetup = () => {
    localStorage.removeItem(getScopedKey(TRAINING_PROFILE_KEY));
    setProfile(null);
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {!profile
          ? <SetupWizard onFinish={finishSetup} />
          : <EntrainementsDashboard profile={profile} onReset={resetSetup} />
        }
      </main>
    </div>
  );
}
