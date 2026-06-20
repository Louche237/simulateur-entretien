import { useState, useEffect, useRef } from "react";
import styles from "./Simulation.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { createLocalSession, upsertLocalSession } from "../../utils/localSessions";
import { sessionAPI, cvAPI } from "../../utils/api";
import { fakeExtractCV } from "../../utils/cvLocal";
import { getPreferredLanguage } from "../../utils/preferences";

const ICONS = {
  grid: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  mic: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  clock: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  file: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  layout: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  history: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  card: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  settings: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  user: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check: <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  book: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  globe: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  spark: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
};

const RECRUTEURS = [
  { id: "aria", name: "Aria", desc: "Bienveillante, rassurante et professionnelle.", emoji: "✨" },
  { id: "guillaume", name: "Guillaume", desc: "Directif, structuré et orienté résultats.", emoji: "⚡" },
  { id: "sophie", name: "Sophie", desc: "Analytique, curieuse et axée sur les détails.", emoji: "🔍" },
  { id: "thomas", name: "Thomas", desc: "Décontracté, humain et à l'écoute.", emoji: "😊" },
];

const MODELES = [
  {
    categorie: "Tech & Développement",
    emoji: "💻",
    items: [
      {
        id: "dev-web",
        poste: "Développeur Web Full-Stack",
        difficulte: "normal",
        description: `Nous recherchons un développeur Full-Stack passionné pour rejoindre notre équipe produit.

Vos missions :
- Développer de nouvelles fonctionnalités front-end (React, Vue ou Angular) et back-end (Node.js, Python ou Java)
- Participer à la conception de l'architecture technique
- Écrire des tests unitaires et d'intégration
- Collaborer avec les designers et les product managers
- Participer aux code reviews

Profil recherché :
- 3+ ans d'expérience en développement web
- Maîtrise de JavaScript / TypeScript
- Expérience avec les API REST et GraphQL
- Connaissance des bases de données SQL et NoSQL
- Sensibilité à la performance et à l'accessibilité`,
      },
      {
        id: "dev-mobile",
        poste: "Développeur Mobile React Native",
        difficulte: "normal",
        description: `Nous cherchons un développeur mobile talentueux pour construire et améliorer nos applications iOS et Android.

Vos missions :
- Développer des fonctionnalités cross-platform avec React Native
- Optimiser les performances et l'expérience utilisateur
- Intégrer des API REST et des services tiers (notifications push, paiement, etc.)
- Publier et maintenir les applications sur l'App Store et le Play Store

Profil :
- 2+ ans d'expérience React Native ou natif iOS/Android
- Connaissance de Redux ou Zustand
- Capacité à diagnostiquer et corriger des bugs complexes`,
      },
      {
        id: "data-scientist",
        poste: "Data Scientist",
        difficulte: "difficile",
        description: `Au sein de notre équipe Data, vous aurez pour mission d'extraire de la valeur depuis nos données pour guider les décisions produit et business.

Vos missions :
- Construire des modèles de machine learning (classification, régression, NLP…)
- Analyser les données avec Python (pandas, scikit-learn, PyTorch/TensorFlow)
- Créer des dashboards et visualisations pour les équipes métier
- Travailler avec les ingénieurs pour déployer vos modèles en production

Profil :
- Master ou PhD en statistiques, mathématiques ou informatique
- Solide expérience en SQL et Python
- Connaissance des pipelines MLOps est un plus`,
      },
      {
        id: "devops",
        poste: "Ingénieur DevOps / SRE",
        difficulte: "difficile",
        description: `Vous rejoindrez notre équipe infrastructure pour garantir la disponibilité, la scalabilité et la sécurité de nos systèmes.

Vos missions :
- Gérer et optimiser nos infrastructures cloud (AWS, GCP ou Azure)
- Mettre en place et améliorer les pipelines CI/CD (GitHub Actions, Jenkins)
- Superviser les systèmes avec des outils comme Prometheus, Grafana, Datadog
- Automatiser les tâches opérationnelles avec Terraform, Ansible

Profil :
- 3+ ans d'expérience en DevOps ou SRE
- Maîtrise de Docker et Kubernetes
- Bonne culture de la sécurité (IAM, secrets management)`,
      },
    ],
  },
  {
    categorie: "Produit & Design",
    emoji: "🎨",
    items: [
      {
        id: "product-manager",
        poste: "Product Manager",
        difficulte: "normal",
        description: `Nous recrutons un Product Manager pour définir et piloter la vision produit de notre plateforme SaaS.

Vos missions :
- Définir et prioriser la roadmap produit en lien avec la stratégie business
- Collecter et analyser les retours utilisateurs (interviews, métriques, A/B tests)
- Rédiger des specs fonctionnelles claires pour les équipes tech
- Collaborer avec les designers, développeurs et équipes commerciales
- Suivre les KPIs et piloter l'amélioration continue

Profil :
- 3+ ans d'expérience en Product Management
- Mentalité data-driven
- Excellentes capacités de communication et de vulgarisation`,
      },
      {
        id: "ux-designer",
        poste: "UX/UI Designer",
        difficulte: "facile",
        description: `En tant que UX/UI Designer, vous serez responsable de créer des expériences numériques intuitives et élégantes.

Vos missions :
- Conduire des recherches utilisateurs (entretiens, tests d'usabilité, personas)
- Créer des wireframes, prototypes interactifs et maquettes haute-fidélité sur Figma
- Travailler en étroite collaboration avec les développeurs pour garantir la conformité du design
- Créer et maintenir notre design system

Profil :
- Portfolio solide démontrant une maîtrise du design centré utilisateur
- Expertise sur Figma
- Sensibilité à l'accessibilité web (WCAG)`,
      },
    ],
  },
  {
    categorie: "Business & Commercial",
    emoji: "📈",
    items: [
      {
        id: "commercial",
        poste: "Commercial B2B / Account Executive",
        difficulte: "normal",
        description: `Rejoignez notre équipe commerciale pour développer notre portefeuille clients sur le marché des PME et ETI.

Vos missions :
- Prospecter et identifier de nouvelles opportunités commerciales
- Gérer le cycle de vente complet : qualification, démo, négociation, closing
- Assurer le suivi et la fidélisation des clients existants
- Atteindre et dépasser vos objectifs trimestriels
- Collaborer avec les équipes marketing et produit

Profil :
- 2+ ans d'expérience en vente B2B SaaS
- Maîtrise des outils CRM (Salesforce, HubSpot)
- Excellent communicant, orienté résultats`,
      },
      {
        id: "marketing",
        poste: "Chargé(e) de Marketing Digital",
        difficulte: "facile",
        description: `Vous piloterez notre stratégie d'acquisition et de fidélisation digitale pour accélérer notre croissance.

Vos missions :
- Gérer les campagnes publicitaires (Google Ads, Meta Ads, LinkedIn)
- Produire du contenu pour nos réseaux sociaux et notre blog (SEO)
- Analyser les performances des campagnes et optimiser le ROI
- Gérer les emailings et les workflows d'automation marketing
- Coordonner avec les équipes design et produit

Profil :
- Maîtrise de Google Analytics, Google Ads, Meta Business Suite
- Expérience avec des outils d'automation (HubSpot, Brevo)
- Créatif(ve), rigoureux(se) et analytique`,
      },
    ],
  },
  {
    categorie: "Finance & Conseil",
    emoji: "💼",
    items: [
      {
        id: "consultant",
        poste: "Consultant en Stratégie",
        difficulte: "difficile",
        description: `Au sein d'un cabinet de conseil en stratégie, vous interviendrez auprès de grands groupes sur des problématiques de transformation business.

Vos missions :
- Analyser la situation d'un client et diagnostiquer ses enjeux stratégiques
- Construire des business cases et des analyses financières
- Animer des ateliers de travail avec les équipes dirigeantes
- Rédiger des livrables clairs et percutants (slides, mémos)
- Proposer des recommandations actionnables

Profil :
- École de commerce ou d'ingénieurs (top 5)
- Excellente maîtrise d'Excel et PowerPoint
- Rigueur analytique, esprit de synthèse et aisance relationnelle`,
      },
      {
        id: "finance",
        poste: "Analyste Financier",
        difficulte: "normal",
        description: `Vous intégrerez notre direction financière pour accompagner le pilotage de la performance de l'entreprise.

Vos missions :
- Construire et mettre à jour les modèles financiers (budget, forecast, LBO)
- Produire les reportings mensuels pour le COMEX
- Analyser les écarts entre réalisé et budget et proposer des plans d'action
- Participer aux due diligences lors d'acquisitions

Profil :
- Formation en finance (école de commerce, Master CCA)
- Excellente maîtrise d'Excel (modélisation financière)
- Connaissance des normes comptables IFRS appréciée`,
      },
    ],
  },
  {
    categorie: "RH & Management",
    emoji: "🤝",
    items: [
      {
        id: "rh",
        poste: "Chargé(e) de Recrutement",
        difficulte: "facile",
        description: `Vous jouerez un rôle clé dans le développement de notre équipe en attirant et recrutant les meilleurs talents.

Vos missions :
- Rédiger et diffuser des offres d'emploi attractives
- Sourcer des candidats sur LinkedIn Recruiter et les jobboards
- Conduire les entretiens de préqualification téléphonique et RH
- Coordonner les processus de recrutement avec les managers
- Gérer l'expérience candidat du premier contact à l'intégration

Profil :
- Formation en RH ou psychologie du travail
- Maîtrise des outils de sourcing (LinkedIn Recruiter, Welcome to the Jungle)
- Excellent relationnel et sens de l'écoute`,
      },
    ],
  },
];

export default function Simulation() {
  const navigate = useNavigate();
  const location = useLocation();
  const preferredLanguage = getPreferredLanguage();
  const [poste, setPoste] = useState(() => location.state?.poste || "");
  const [entreprise, setEntreprise] = useState(() => location.state?.entreprise || "");
  const [niveau, setNiveau] = useState("debutant");
  const [difficulte, setDifficulte] = useState("facile");
  const [recruteur, setRecruteur] = useState("aria");
  const [surprises, setSurprises] = useState(false);
  const [duree, setDuree] = useState(10);
  const [langue, setLangue] = useState(preferredLanguage);
  const [description, setDescription] = useState(() => location.state?.description || "");
  const [type, setType] = useState("rh");
  const [cv, setCv] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [cvExtracting, setCvExtracting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showModeles, setShowModeles] = useState(false);
  const [searchModele, setSearchModele] = useState("");
  const modalRef = useRef(null);

  // Fermer la modal en cliquant en dehors
  useEffect(() => {
    if (!showModeles) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowModeles(false);
      }
    };
    const handleKey = (e) => { if (e.key === "Escape") setShowModeles(false); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showModeles]);

  const handleSelectModele = (modele) => {
    setPoste(modele.poste);
    setDescription(modele.description);
    setDifficulte(modele.difficulte);
    setShowModeles(false);
    setSearchModele("");
  };

  const filteredModeles = searchModele.trim()
    ? MODELES.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (m) =>
            m.poste.toLowerCase().includes(searchModele.toLowerCase()) ||
            cat.categorie.toLowerCase().includes(searchModele.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : MODELES;

  const handleCvChange = async (file) => {
    setCv(file || null);
    setCvData(null);

    if (!file) return;

    setCvExtracting(true);
    try {
      const remote = await cvAPI.extraire(file, { langue });
      if (remote.success && remote.cvData) {
        setCvData(remote.cvData);
      } else {
        const extracted = await fakeExtractCV(file);
        setCvData(extracted);
      }
    } catch {
      const extracted = await fakeExtractCV(file);
      setCvData(extracted);
    } finally {
      setCvExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poste.trim()) return;
    setCreating(true);

    try {
      const remote = await sessionAPI.creer({
        poste,
        entreprise,
        niveau,
        difficulte,
        recruteur,
        surprises,
        duree,
        langue,
        description,
        type,
        cvName: cv?.name,
        cvSummary: cvData?.summary || "",
        skills: cvData?.skills || [],
      });

      if (remote.success && remote.session) {
        upsertLocalSession(remote.session);
        navigate("/entretien", { state: { sessionId: remote.session.id } });
        return;
      }
    } catch {
      // Fallback local below.
    } finally {
      setCreating(false);
    }

    const session = createLocalSession({
      poste,
      entreprise,
      niveau,
      difficulte,
      recruteur,
      surprises,
      duree,
      langue,
      description,
      type,
      cvName: cv?.name,
      cvSummary: cvData?.summary || "",
      skills: cvData?.skills || [],
    });
    navigate("/entretien", { state: { sessionId: session.id } });
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      
      {/* MAIN */}
      <main className={styles.main}>
        <div className={styles.container}>

          {/* EN-TÊTE */}
          <div className={styles.header}>
            <h1>Démarrez votre entretien</h1>
            <p>Créez un entretien personnalisé à partir d'une offre réelle ou d'un modèle métier.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>

            {/* POSTE */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Quel poste visez-vous ? *</label>

              <div className={styles.modeCard}>
                <div className={styles.modeTitle}>Mode 1 — Offre précise (manuel)</div>
                <div className={styles.modeDesc}>Si vous avez une offre réelle, saisissez le poste exact puis adaptez la description de poste.</div>
              </div>

              <div className={styles.inputWrap}>
                <input
                  type="text"
                  className={`${styles.input} ${poste ? styles.inputFilled : ""}`}
                  placeholder="developpeur web"
                  value={poste}
                  onChange={(e) => setPoste(e.target.value)}
                />
                {poste && <span className={styles.inputCheck}>{ICONS.check}</span>}
              </div>
              <p className={styles.hint}>💡 Vous pouvez saisir n'importe quel poste</p>

              <div className={styles.orDivider}><span>OU</span></div>

              <div className={styles.modeCard}>
                <div className={styles.modeTitle}>Mode 2 — Pas d'offre précise ?</div>
                <div className={styles.modeDesc}>Choisissez un modèle pour pré-remplir automatiquement le poste et une description réaliste.</div>
                <button type="button" className={styles.btnModele} onClick={() => setShowModeles(true)}>
                  {ICONS.book} Choisir un modèle
                </button>
              </div>
            </div>

            {/* ENTREPRISE */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Entreprise *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Nom de l'entreprise"
                value={entreprise}
                onChange={(e) => setEntreprise(e.target.value)}
              />
            </div>

            {/* TYPE D'ENTRETIEN */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Type d'entretien</label>
              <div className={styles.choiceGrid2}>
                {[
                  { id: "rh", label: "Entretien RH", sub: "Aisance relationnelle, parcours et motivation", emoji: "🤝" },
                  { id: "technique", label: "Entretien technique", sub: "Compétences dures, algorithmes et outils", emoji: "💻" },
                  { id: "comportemental", label: "Entretien comportemental", sub: "Soft skills, gestion des conflits et stress", emoji: "🧠" },
                  { id: "direction", label: "Entretien direction", sub: "Vision stratégique, leadership et fit culturel", emoji: "👑" },
                ].map((t) => (
                  <div
                    key={t.id}
                    className={`${styles.choiceCard} ${type === t.id ? styles.choiceActive : ""}`}
                    onClick={() => setType(t.id)}
                  >
                    <span className={styles.choiceEmoji}>{t.emoji}</span>
                    <span className={styles.choiceLabel}>{t.label}</span>
                    <span className={styles.choiceSub}>{t.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NIVEAU */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Votre niveau d'expérience</label>
              <div className={styles.choiceGrid3}>
                {[
                  { id: "debutant", label: "Débutant", sub: "0-2 ans d'expérience", emoji: "✨" },
                  { id: "intermediaire", label: "Intermédiaire", sub: "3-5 ans d'expérience", emoji: "⚡" },
                  { id: "avance", label: "Avancé", sub: "5+ ans d'expérience", emoji: "🎯" },
                ].map((n) => (
                  <div
                    key={n.id}
                    className={`${styles.choiceCard} ${niveau === n.id ? styles.choiceActive : ""}`}
                    onClick={() => setNiveau(n.id)}
                  >
                    <span className={styles.choiceEmoji}>{n.emoji}</span>
                    <span className={styles.choiceLabel}>{n.label}</span>
                    <span className={styles.choiceSub}>{n.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DIFFICULTÉ */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Difficulté des questions</label>
              <p className={styles.sectionHint}>Choisissez le niveau de complexité des questions (indépendant de votre séniorité)</p>
              <div className={styles.choiceGrid3}>
                {[
                  { id: "facile", label: "Facile", sub: "Questions simples et directes", stars: "⭐" },
                  { id: "normal", label: "Normal", sub: "Questions standards d'entretien", stars: "⭐⭐" },
                  { id: "difficile", label: "Difficile", sub: "Questions pointues et cas complexes", stars: "⭐⭐⭐" },
                ].map((d) => (
                  <div
                    key={d.id}
                    className={`${styles.choiceCard} ${difficulte === d.id ? styles.choiceActive : ""}`}
                    onClick={() => setDifficulte(d.id)}
                  >
                    <span className={styles.choiceStars}>{d.stars}</span>
                    <span className={styles.choiceLabel}>{d.label}</span>
                    <span className={styles.choiceSub}>{d.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RECRUTEUR */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Personnalité du recruteur</label>
              <p className={styles.sectionHint}>Choisissez le style de recruteur que vous voulez affronter pendant la simulation</p>
              <div className={styles.choiceGrid2}>
                {RECRUTEURS.map((r) => (
                  <div
                    key={r.id}
                    className={`${styles.choiceCard} ${recruteur === r.id ? styles.choiceActive : ""}`}
                    onClick={() => setRecruteur(r.id)}
                  >
                    <span className={styles.choiceEmoji}>{r.emoji}</span>
                    <span className={styles.choiceLabel}>{r.name}</span>
                    <span className={styles.choiceSub}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QUESTIONS SURPRISES */}
            <div className={styles.section}>
              <div className={styles.toggleCard}>
                <div>
                  <div className={styles.toggleTitle}>Questions surprises 🎲</div>
                  <div className={styles.toggleDesc}>Ajoute des questions inattendues pour tester votre spontanéité et votre capacité d'improvisation.</div>
                </div>
                <div
                  className={`${styles.toggle} ${surprises ? styles.toggleOn : ""}`}
                  onClick={() => setSurprises((v) => !v)}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>
              <p className={styles.hint}>
                {surprises ? "✅ Des questions surprises seront ajoutées." : "Aucune question surprise ne sera ajoutée."}
              </p>
            </div>

            {/* DURÉE */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Durée de l'entretien</label>
              <div className={styles.choiceGrid3}>
                {[10, 15, 20].map((d) => (
                  <div
                    key={d}
                    className={`${styles.durationCard} ${duree === d ? styles.choiceActive : ""}`}
                    onClick={() => setDuree(d)}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>≈ {d} min</span>
                  </div>
                ))}
              </div>
              <p className={styles.hint}>Vous pouvez mettre fin à l'entretien à tout moment si nécessaire</p>
            </div>

            {/* LANGUE */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>{ICONS.globe} Langue de l'entretien</label>
              <div className={styles.choiceGrid2}>
                <div
                  className={`${styles.langCard} ${langue === "fr" ? styles.choiceActive : ""}`}
                  onClick={() => setLangue("fr")}
                >
                  🇫🇷 Français
                </div>
                <div
                  className={`${styles.langCard} ${langue === "en" ? styles.choiceActive : ""}`}
                  onClick={() => setLangue("en")}
                >
                  🇬🇧 English
                </div>
              </div>
              <p className={styles.hint}>L'IA s'exprimera dans la langue choisie</p>
            </div>

            {/* DESCRIPTION DU POSTE */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Description du poste <span className={styles.optional}>(optionnel mais fortement recommandé)</span></label>
              <textarea
                className={styles.textarea}
                placeholder="Collez ici la description du poste ou décrivez le contexte de l'entretien..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* CV */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Votre CV <span className={styles.optional}>(optionnel mais recommandé)</span></label>
              <div className={styles.fileWrap}>
                <input
                  type="file"
                  id="cv-upload"
                  accept=".pdf,.docx,.txt"
                  className={styles.fileInput}
                  onChange={(e) => handleCvChange(e.target.files[0])}
                />
                <label htmlFor="cv-upload" className={styles.fileLabel}>
                  {cvExtracting ? "Extraction du CV..." : cv ? cv.name : "Choisir un fichier"}
                </label>
              </div>
              <p className={styles.hint}>📄 PDF, DOCX ou TXT • Max 5 MB • Pour des questions personnalisées</p>
              {cvData && !cvExtracting && (
                <div className={styles.modeCard}>
                  <div className={styles.modeTitle}>CV analysé</div>
                  <div className={styles.modeDesc}>
                    {cvData.title}
                    {cvData.skills?.length ? ` · ${cvData.skills.slice(0, 4).join(", ")}` : ""}
                  </div>
                </div>
              )}
            </div>

            {/* BOUTON SUBMIT */}
            <button type="submit" className={styles.btnSubmit} disabled={creating || cvExtracting}>
              {ICONS.spark} {creating ? "Création en cours..." : cvExtracting ? "Préparation du CV..." : "Commencer l'entretien"}
            </button>
            <p className={styles.submitHint}>
              L'entretien démarre immédiatement • Durée : {duree} min
            </p>

          </form>
        </div>
      </main>

      {/* MODAL MODÈLES */}
      {showModeles && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} ref={modalRef}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>📋 Choisir un modèle de poste</h2>
                <p className={styles.modalSubtitle}>Sélectionnez un modèle pour pré-remplir le poste et la description.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowModeles(false)} aria-label="Fermer">✕</button>
            </div>

            <div className={styles.modalSearch}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                className={styles.modalSearchInput}
                placeholder="Rechercher un poste..."
                value={searchModele}
                onChange={(e) => setSearchModele(e.target.value)}
                autoFocus
              />
              {searchModele && (
                <button className={styles.modalSearchClear} onClick={() => setSearchModele("")} aria-label="Effacer">✕</button>
              )}
            </div>

            <div className={styles.modalBody}>
              {filteredModeles.length === 0 ? (
                <div className={styles.modalEmpty}>
                  <span>🔍</span>
                  <p>Aucun modèle ne correspond à « {searchModele} »</p>
                </div>
              ) : (
                filteredModeles.map((cat) => (
                  <div key={cat.categorie} className={styles.modalCat}>
                    <div className={styles.modalCatTitle}>
                      <span>{cat.emoji}</span> {cat.categorie}
                    </div>
                    <div className={styles.modalItems}>
                      {cat.items.map((modele) => (
                        <button
                          key={modele.id}
                          type="button"
                          className={styles.modalItem}
                          onClick={() => handleSelectModele(modele)}
                        >
                          <div className={styles.modalItemMain}>
                            <span className={styles.modalItemPoste}>{modele.poste}</span>
                            <span className={`${styles.modalItemBadge} ${styles[`badge_${modele.difficulte}`]}`}>
                              {modele.difficulte === "facile" ? "⭐ Facile" : modele.difficulte === "normal" ? "⭐⭐ Normal" : "⭐⭐⭐ Difficile"}
                            </span>
                          </div>
                          <span className={styles.modalItemArrow}>→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
