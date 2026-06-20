// ─── EXTRACTION SIMULÉE DU CV ────────────────────────────────
export async function fakeExtractCV(file) {
  await new Promise((r) => setTimeout(r, 800));

  const SKILLS_POOL = [
    "JavaScript", "React", "Node.js", "Python", "SQL", "MongoDB",
    "TypeScript", "Vue.js", "Docker", "Git", "REST API", "GraphQL",
    "CSS", "HTML", "Express.js", "PostgreSQL", "Redis", "AWS",
    "Agile", "Scrum", "Leadership", "Communication", "Gestion de projet",
  ];

  const NB_SKILLS = Math.floor(Math.random() * 6) + 4;
  const shuffled = [...SKILLS_POOL].sort(() => Math.random() - 0.5);
  const skills = shuffled.slice(0, NB_SKILLS);

  return {
    rawName: file.name,
    title: "Développeur Full-Stack",
    summary:
      "Professionnel expérimenté avec une solide expertise en développement logiciel. " +
      "Capacité à concevoir et déployer des solutions techniques robustes et évolutives. " +
      "Orienté résultats avec de bonnes compétences en communication et travail d'équipe.",
    skills,
    experiences: [
      {
        poste: "Développeur Full-Stack",
        entreprise: "TechCorp",
        duree: "2 ans",
        missions: [
          "Développement d'APIs REST avec Node.js",
          "Création d'interfaces React performantes",
          "Mise en place de pipelines CI/CD",
        ],
      },
      {
        poste: "Développeur Frontend",
        entreprise: "StartupXYZ",
        duree: "1 an",
        missions: [
          "Intégration de maquettes UI/UX",
          "Optimisation des performances web",
          "Collaboration avec l'équipe produit",
        ],
      },
    ],
    education: [
      {
        diplome: "Master Informatique",
        ecole: "Université de Yaoundé",
        annee: "2021",
      },
    ],
  };
}

// ─── EXTRACTION DES MOTS-CLÉS DE L'OFFRE ────────────────────
export function getOfferInsights(offre) {
  if (!offre || offre.length < 20) return null;

  const TECH_KEYWORDS = [
    "javascript", "react", "node.js", "python", "sql", "mongodb",
    "typescript", "vue", "docker", "kubernetes", "git", "api",
    "graphql", "css", "html", "express", "postgresql", "redis",
    "aws", "azure", "gcp", "ci/cd", "devops", "microservices",
    "angular", "php", "java", "spring", "django", "flask",
  ];
  const SOFT_KEYWORDS = [
    "leadership", "communication", "autonomie", "rigueur", "créativité",
    "adaptabilité", "travail en équipe", "gestion de projet", "agile",
    "scrum", "organisation", "initiative", "proactivité", "analyse",
  ];

  const lower = offre.toLowerCase();
  const keywords = [
    ...TECH_KEYWORDS.filter((k) => lower.includes(k)),
    ...SOFT_KEYWORDS.filter((k) => lower.includes(k)),
  ].slice(0, 10);

  // Détection du niveau
  const niveau = lower.includes("senior") || lower.includes("confirmé") ? "Senior"
    : lower.includes("junior") || lower.includes("débutant") ? "Junior"
    : "Intermédiaire";

  // Détection du type de poste
  const typePoste = lower.includes("frontend") ? "Frontend"
    : lower.includes("backend") ? "Backend"
    : lower.includes("full-stack") || lower.includes("fullstack") ? "Full-Stack"
    : lower.includes("data") ? "Data"
    : lower.includes("devops") ? "DevOps"
    : "Général";

  // Salaire détecté
  const salaryMatch = offre.match(/(\d{2,3})[\s]?k/i);
  const salaire = salaryMatch ? `${salaryMatch[1]}k€` : null;

  return { keywords, niveau, typePoste, salaire };
}

// ─── SCORE CV vs OFFRE ───────────────────────────────────────
export function scoreCVAgainstOffer(cvData, offre) {
  if (!cvData || !offre) return null;

  const lower = offre.toLowerCase();
  const cvSkillsLower = cvData.skills.map((s) => s.toLowerCase());

  // Compétences correspondantes
  const matched = cvData.skills.filter((skill) =>
    lower.includes(skill.toLowerCase())
  );

  // Compétences manquantes depuis l'offre
  const offerInsights = getOfferInsights(offre);
  const missing = (offerInsights?.keywords || []).filter(
    (k) => !cvSkillsLower.some((s) => s.includes(k) || k.includes(s))
  );

  // Calcul du score
  const matchRatio = matched.length / Math.max(cvData.skills.length, 1);
  const keywordRatio = offerInsights?.keywords.length
    ? matched.length / offerInsights.keywords.length
    : 0;
  const score = Math.min(100, Math.round((matchRatio * 40) + (keywordRatio * 60)));

  // Niveau de correspondance
  const niveau = score >= 75 ? "Excellente" : score >= 55 ? "Bonne" : score >= 35 ? "Partielle" : "Faible";
  const couleur = score >= 75 ? "#22c55e" : score >= 55 ? "#f59e0b" : score >= 35 ? "#f97316" : "#ef4444";

  // Recommandations
  const recommendations = [];
  if (missing.length > 0) {
    recommendations.push(`Ajoutez ces compétences manquantes : ${missing.slice(0, 3).join(", ")}`);
  }
  if (matched.length < 3) {
    recommendations.push("Reformulez votre résumé en intégrant les termes de l'offre");
  }
  if (!lower.includes(cvData.title?.toLowerCase() || "")) {
    recommendations.push("Adaptez votre titre professionnel au poste visé");
  }
  if (cvData.experiences?.length < 2) {
    recommendations.push("Détaillez davantage vos expériences professionnelles");
  }
  recommendations.push("Quantifiez vos réalisations avec des chiffres concrets");
  recommendations.push("Personnalisez votre lettre de motivation pour ce poste");

  return { score, niveau, couleur, matched, missing, recommendations };
}

// ─── GÉNÉRATION CV ADAPTÉ ────────────────────────────────────
export function generateAdaptedCV(cvData, offre) {
  const insights = getOfferInsights(offre);
  const score = scoreCVAgainstOffer(cvData, offre);

  const highlightedSkills = [
    ...cvData.skills.filter((s) =>
      offre.toLowerCase().includes(s.toLowerCase())
    ),
    ...(insights?.keywords || [])
      .filter((k) => !cvData.skills.some((s) => s.toLowerCase() === k))
      .slice(0, 3),
  ].slice(0, 8);

  const suggestedTitle = insights?.typePoste !== "Général"
    ? `${insights.typePoste} Developer ${insights.niveau}`
    : cvData.title || "Développeur";

  const keywordsInSummary = (insights?.keywords || []).slice(0, 3).join(", ");
  const adaptedSummary = `Professionnel ${insights?.niveau || ""} spécialisé en ${keywordsInSummary || "développement logiciel"}, `
    + `avec une expérience démontrée dans la conception et le déploiement de solutions techniques. `
    + `${score && score.matched.length > 0 ? `Compétences validées : ${score.matched.slice(0, 3).join(", ")}.` : ""} `
    + `Orienté résultats, autonome et capable de m'intégrer rapidement dans une équipe.`;

  const adaptedExperiences = (cvData.experiences || []).map((exp) => ({
    ...exp,
    missions: exp.missions.map((m) => {
      const kw = insights?.keywords.find((k) => m.toLowerCase().includes(k));
      return kw ? `${m} (${kw})` : m;
    }),
  }));

  return {
    suggestedTitle,
    adaptedSummary,
    highlightedSkills,
    adaptedExperiences,
    score: score?.score || 0,
    niveau: score?.niveau || "Partielle",
    couleur: score?.couleur || "#f59e0b",
  };
}