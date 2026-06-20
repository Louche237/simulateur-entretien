export const BASE_INTERVIEW_QUESTIONS = [
  "Présentez-vous en 90 secondes en reliant votre parcours au poste visé.",
  "Pourquoi ce poste vous intéresse-t-il précisément ?",
  "Décrivez une réussite professionnelle dont vous êtes fier.",
  "Parlez d'une difficulté rencontrée et de la façon dont vous l'avez gérée.",
  "Quelles sont vos trois forces principales pour ce rôle ?",
  "Que souhaitez-vous améliorer dans votre pratique professionnelle ?",
  "Pourquoi devrions-nous vous choisir plutôt qu'un autre candidat ?",
  "Avez-vous une question pertinente à poser au recruteur ?",
];

export const DIFFICULT_INTERVIEW_QUESTIONS = [
  "Décrivez une décision que vous avez prise avec peu d'informations.",
  "Comment réagiriez-vous si vos priorités changeaient trois fois dans la même semaine ?",
  "Donnez un exemple où vous avez convaincu une personne en désaccord avec vous.",
];

export const SURPRISE_INTERVIEW_QUESTIONS = [
  "Si je demandais à votre ancien manager votre principal défaut, que dirait-il ?",
  "Expliquez votre métier à une personne qui ne connaît pas votre secteur.",
];

export const TECH_KEYWORDS = [
  "javascript", "react", "node.js", "python", "sql", "mongodb",
  "typescript", "vue", "docker", "kubernetes", "git", "api",
  "graphql", "css", "html", "express", "postgresql", "redis",
  "aws", "azure", "gcp", "ci/cd", "devops", "microservices",
  "angular", "php", "java", "spring", "django", "flask",
];

export const SOFT_KEYWORDS = [
  "leadership", "communication", "autonomie", "rigueur", "créativité",
  "adaptabilité", "travail en équipe", "gestion de projet", "agile",
  "scrum", "organisation", "initiative", "proactivité", "analyse",
];

export const SKILLS_POOL = [
  "JavaScript", "React", "Node.js", "Python", "SQL", "MongoDB",
  "TypeScript", "Vue.js", "Docker", "Git", "REST API", "GraphQL",
  "CSS", "HTML", "Express.js", "PostgreSQL", "Redis", "AWS",
  "Agile", "Scrum", "Leadership", "Communication", "Gestion de projet",
];

export const ROLE_KEYWORDS = [
  { match: ["frontend", "front-end", "ui"], value: "Frontend" },
  { match: ["backend", "back-end", "api"], value: "Backend" },
  { match: ["full-stack", "fullstack"], value: "Full-Stack" },
  { match: ["data", "analyst"], value: "Data" },
  { match: ["devops"], value: "DevOps" },
  { match: ["product manager", "product"], value: "Product" },
  { match: ["project manager", "chef de projet"], value: "Gestion de projet" },
];

export const DEFAULT_QUESTION_BANK = [
  {
    id: "bank-1",
    category: "presentation",
    text: "Parlez-moi de vous en lien avec ce poste.",
  },
  {
    id: "bank-2",
    category: "motivation",
    text: "Qu'est-ce qui vous attire dans cette opportunité ?",
  },
  {
    id: "bank-3",
    category: "experience",
    text: "Décrivez une réalisation professionnelle dont vous êtes particulièrement fier.",
  },
  {
    id: "bank-4",
    category: "behavioral",
    text: "Racontez une situation difficile et la manière dont vous l'avez gérée.",
  },
  {
    id: "bank-5",
    category: "technical",
    text: "Quelle compétence technique vous différencie le plus aujourd'hui ?",
  },
  {
    id: "bank-6",
    category: "culture",
    text: "Comment collaborez-vous avec une équipe qui fonctionne très vite ?",
  },
  {
    id: "bank-7",
    category: "surprise",
    text: "Si vous deviez apprendre un nouveau métier en 30 jours, comment vous y prendriez-vous ?",
  },
  {
    id: "bank-8",
    category: "closure",
    text: "Quelle question aimeriez-vous nous poser avant de conclure ?",
  },
];
