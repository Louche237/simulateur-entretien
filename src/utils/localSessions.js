const SESSIONS_KEY = "jobmentor.sessions";
const ACTIVE_SESSION_KEY = "jobmentor.activeSessionId";
const COMPETENCES_PROGRESS_KEY = "jobmentor.competencesProgress";

// ─── BANQUE DE QUESTIONS PAR COMPÉTENCE ──────────────────────────
export const COMPETENCE_QUESTIONS = {
  pitch: [
    "Présentez-vous en 90 secondes en reliant votre parcours à votre poste cible.",
    "Quelle est votre valeur ajoutée unique par rapport aux autres candidats pour ce poste ?",
    "En trois mots, comment vous décrirait votre meilleur collègue, et pourquoi ?",
    "Quel fil conducteur relie toutes vos expériences professionnelles ?",
  ],
  star: [
    "Racontez une situation où vous avez dû gérer un projet en retard. Quel était votre rôle, vos actions, et le résultat final ?",
    "Décrivez un moment où vous avez convaincu votre équipe d'adopter une nouvelle approche. Comment avez-vous procédé ?",
    "Parlez d'un moment où vous avez dû prendre une décision difficile avec peu de données. Qu'avez-vous fait ?",
    "Donnez un exemple d'une réussite dont vous êtes particulièrement fier. Détaillez situation, tâche, action, résultat.",
    "Racontez une expérience où vous avez résolu un problème complexe de façon créative.",
  ],
  motiv: [
    "Pourquoi ce poste en particulier vous attire-t-il, et pas un autre dans le même secteur ?",
    "Où vous voyez-vous dans 3 ans, et comment ce poste s'inscrit dans cette trajectoire ?",
    "Qu'est-ce qui vous a poussé à quitter (ou envisager de quitter) votre poste actuel ?",
    "Qu'est-ce qui vous donne de l'énergie dans votre travail au quotidien ?",
  ],
  nego: [
    "Quelles sont vos prétentions salariales et comment les avez-vous calculées ?",
    "On vous propose 10% en dessous de votre cible. Comment réagissez-vous ?",
    "Au-delà du salaire fixe, quels éléments du package sont importants pour vous ?",
    "Vous avez une contre-offre de votre employeur actuel. Comment gérez-vous la situation ?",
    "Comment justifiez-vous une augmentation significative par rapport à votre salaire actuel ?",
  ],
  echec: [
    "Parlez-moi d'un vrai échec professionnel. Qu'est-il arrivé et qu'en avez-vous appris ?",
    "Quel est votre plus grand regret dans votre parcours, et que feriez-vous différemment ?",
    "Donnez un exemple d'un projet qui ne s'est pas passé comme prévu. Quel était votre rôle ?",
    "Comment transformez-vous un échec en apprentissage concret pour la suite ?",
  ],
  stress: [
    "Comment gérez-vous la pression quand plusieurs urgences arrivent en même temps ?",
    "Parlez d'une situation où vous étiez sous pression maximale. Comment avez-vous réagi ?",
    "Quel est votre plus grand défaut professionnel ? Comment le compensez-vous ?",
    "Comment réagissez-vous face à une critique que vous estimez injuste ?",
  ],
  conflit: [
    "Décrivez un conflit avec un collègue. Comment l'avez-vous résolu ?",
    "Comment gérez-vous les désaccords avec votre hiérarchie ?",
    "Donnez un exemple de situation où vous avez dû dire non à quelqu'un. Comment avez-vous géré ça ?",
    "Vous travaillez avec quelqu'un dont le style est très différent du vôtre. Comment vous adaptez-vous ?",
  ],
  leader: [
    "Donnez un exemple où vous avez mobilisé une équipe autour d'un objectif difficile.",
    "Comment prenez-vous des décisions importantes quand votre équipe est divisée ?",
    "Parlez d'un moment où vous avez dû donner un feedback difficile à un collaborateur.",
    "Comment faites-vous grandir les membres de votre équipe ?",
  ],
  tech: [
    "Comment expliquez-vous votre expertise technique à quelqu'un qui ne connaît pas votre domaine ?",
    "Quelle est la tendance technologique ou métier qui va le plus impacter votre secteur dans 2 ans ?",
    "Racontez un projet technique dont vous êtes fier. Quelle était votre contribution spécifique ?",
    "Comment vous maintenez-vous à jour sur les évolutions de votre métier ?",
    "Quelle est la décision technique la plus difficile que vous ayez dû prendre ?",
    "Comment gérez-vous la dette technique (ou les mauvaises pratiques) dans un projet ?",
  ],
};

// Les questions de base, difficiles et surprises sont désormais générées dynamiquement dans buildQuestions en fonction de la langue et du contexte.

const getScopedKey = (baseKey) => {
  if (typeof localStorage === "undefined") return baseKey;
  try {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      const userIdent = user.id || user.email;
      if (userIdent) {
        return `${baseKey}_${userIdent}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return baseKey;
};

const readSessions = () => {
  try {
    const raw = localStorage.getItem(getScopedKey(SESSIONS_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeSessions = (sessions) => {
  localStorage.setItem(getScopedKey(SESSIONS_KEY), JSON.stringify(sessions));
};

const upsertSession = (session) => {
  const sessions = readSessions();
  const index = sessions.findIndex((entry) => entry.id === session.id);

  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }

  writeSessions(sessions);
  setActiveSessionId(session.id);
  return session;
};

const buildQuestions = (config) => {
  if (Array.isArray(config.questions) && config.questions.length > 0) {
    return config.questions.map((text, index) => ({
      id: `q-${index + 1}`,
      text,
      answer: "",
    }));
  }

  const isEnglish = String(config.langue).trim().toLowerCase() === "en";
  const poste = config.poste ? config.poste.trim() : (isEnglish ? "this role" : "ce poste");
  const entreprise = config.entreprise ? config.entreprise.trim() : "";

  const base = isEnglish ? [
    `Introduce yourself in 90 seconds, connecting your background to the role of ${poste}${entreprise ? ` at ${entreprise}` : ""}.`,
    `Why are you interested in the ${poste} position${entreprise ? ` at ${entreprise}` : ""} specifically?`,
    "Describe a professional achievement you are proud of.",
    "Tell me about a difficult situation you faced and how you handled it.",
    `What are your three main strengths for the role of ${poste}?`,
    "What would you like to improve in your professional practice?",
    `Why should we choose you for this ${poste} role over another candidate?`,
    "Do you have a thoughtful question for the interviewer?",
  ] : [
    `Présentez-vous en 90 secondes en reliant votre parcours au poste de ${poste}${entreprise ? ` chez ${entreprise}` : ""}.`,
    `Pourquoi le poste de ${poste}${entreprise ? ` chez ${entreprise}` : ""} vous intéresse-t-il précisément ?`,
    "Décrivez une réussite professionnelle dont vous êtes fier.",
    "Parlez d'une difficulté rencontrée et de la façon dont vous l'avez gérée.",
    `Quelles sont vos trois forces principales pour le rôle de ${poste} ?`,
    "Que souhaitez-vous améliorer dans votre pratique professionnelle ?",
    `Pourquoi devrions-nous vous choisir pour ce poste de ${poste} plutôt qu'un autre candidat ?`,
    "Avez-vous une question pertinente à poser au recruteur ?",
  ];

  const diff = isEnglish ? [
    "Describe a decision you made with very little information.",
    "How would you react if your priorities changed three times in the same week?",
    "Give an example of how you convinced someone who disagreed with you.",
  ] : [
    "Décrivez une décision que vous avez prise avec peu d'informations.",
    "Comment réagiriez-vous si vos priorités changeaient trois fois dans la même semaine ?",
    "Donnez un exemple où vous avez convaincu une personne en désaccord avec vous.",
  ];

  const surprise = isEnglish ? [
    "If I asked your former manager about your biggest weakness, what would they say?",
    "Explain your job to someone who does not know your industry.",
  ] : [
    "Si je demandais à votre ancien manager votre principal défaut, que dirait-il ?",
    "Expliquez votre métier à une personne qui ne connaît pas votre secteur.",
  ];

  const questions = [...base];

  if (config.difficulte === "difficile") {
    questions.splice(4, 0, ...diff);
  }

  if (config.surprises) {
    questions.splice(3, 0, ...surprise);
  }

  const count = config.duree >= 20 ? 10 : config.duree >= 15 ? 8 : 6;
  return questions.slice(0, count).map((text, index) => ({
    id: `q-${index + 1}`,
    text,
    answer: "",
  }));
};

export const getLocalSessions = () => readSessions();

export const getActiveSessionId = () => localStorage.getItem(getScopedKey(ACTIVE_SESSION_KEY));

export const setActiveSessionId = (sessionId) => {
  localStorage.setItem(getScopedKey(ACTIVE_SESSION_KEY), sessionId);
};

export const createLocalSession = (config) => {
  const session = {
    id: `local-${Date.now()}`,
    source: config.source || "local",
    type: config.type || "rh",
    status: "en_cours",
    createdAt: new Date().toISOString(),
    finishedAt: null,
    poste: config.poste.trim(),
    entreprise: config.entreprise.trim(),
    niveau: config.niveau,
    difficulte: config.difficulte,
    recruteur: config.recruteur,
    surprises: config.surprises,
    duree: config.duree,
    langue: config.langue,
    description: config.description?.trim() || "",
    cvName: config.cvName || "",
    score: null,
    feedback: null,
    questions: buildQuestions(config),
  };

  return upsertSession(session);
};

export const upsertLocalSession = (session) => upsertSession(session);

export const getLocalSession = (sessionId) =>
  readSessions().find((session) => session.id === sessionId) || null;

export const updateLocalSession = (sessionId, updater) => {
  let updated = null;
  const sessions = readSessions().map((session) => {
    if (session.id !== sessionId) return session;
    updated = typeof updater === "function" ? updater(session) : { ...session, ...updater };
    return updated;
  });

  writeSessions(sessions);
  return updated;
};

export const finishLocalSession = (sessionId) => {
  return updateLocalSession(sessionId, (session) => {
    const isEnglish = String(session.langue).trim().toLowerCase() === "en";
    const answered = session.questions.filter((question) => question.answer.trim()).length;
    const completion = answered / session.questions.length;
    const averageLength = session.questions.reduce((sum, question) => sum + question.answer.trim().length, 0) / Math.max(answered, 1);
    const depthBonus = Math.min(20, Math.round(averageLength / 18));
    const score = Math.min(100, Math.round(completion * 70 + depthBonus));

    const summary = isEnglish
      ? (score >= 75
        ? "Good general structure. Keep illustrating your answers with specific examples."
        : "Solid foundation. Work mainly on example precision and the conclusion of each answer.")
      : (score >= 75
        ? "Bonne structure générale. Continuez à illustrer vos réponses avec des exemples précis."
        : "Base correcte. Travaillez surtout la précision des exemples et la conclusion de chaque réponse.");

    return {
      ...session,
      status: "terminee",
      finishedAt: new Date().toISOString(),
      score,
      feedback: {
        answered,
        total: session.questions.length,
        summary,
      },
    };
  });
};

export const getLocalStats = () => {
  const sessions = readSessions();
  const finished = sessions.filter((session) => session.status === "terminee");
  const totalSessions = finished.length;
  const scoreMoyen = totalSessions
    ? Math.round(finished.reduce((sum, session) => sum + (session.score || 0), 0) / totalSessions)
    : 0;
  const meilleurScore = finished.reduce((best, session) => Math.max(best, session.score || 0), 0);
  const tempsTotal = finished.reduce((sum, session) => sum + (session.duree || 0), 0);

  return {
    totalSessions,
    scoreMoyen,
    tempsTotal,
    meilleurScore,
    amelioration: totalSessions > 1 ? "+0%" : "N/A",
    badges: Math.min(4, totalSessions),
    objectifMensuel: 20,
    scoreCible: 85,
  };
};

export const deleteLocalSession = (sessionId) => {
  const sessions = readSessions().filter((session) => session.id !== sessionId);
  writeSessions(sessions);
  if (getActiveSessionId() === sessionId) {
    localStorage.removeItem(getScopedKey(ACTIVE_SESSION_KEY));
  }
};

// ─── COMPÉTENCES PROGRESS ─────────────────────────────────────────

export const getCompetencesProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(getScopedKey(COMPETENCES_PROGRESS_KEY)) || "{}");
  } catch {
    return {};
  }
};

export const markCompetenceDone = (competenceId) => {
  const progress = getCompetencesProgress();
  progress[competenceId] = {
    done: true,
    doneAt: new Date().toISOString(),
  };
  localStorage.setItem(getScopedKey(COMPETENCES_PROGRESS_KEY), JSON.stringify(progress));
};

export const createCompetenceSession = (competenceId, profile, competenceLabel) => {
  const questions = COMPETENCE_QUESTIONS[competenceId] || [];
  const langue = profile?.langue || "fr";
  const poste = profile?.postes?.[0] || "Entraînement";

  const session = {
    id: `local-${Date.now()}`,
    source: "competence",
    competenceId,
    status: "en_cours",
    createdAt: new Date().toISOString(),
    finishedAt: null,
    poste,
    entreprise: "JobMentor",
    niveau: "intermediaire",
    difficulte: "normal",
    recruteur: "aria",
    surprises: false,
    duree: 10,
    langue,
    description: `Session ciblée : ${competenceLabel || competenceId}`,
    cvName: "",
    score: null,
    feedback: null,
    questions: questions.map((text, index) => ({
      id: `q-${index + 1}`,
      text,
      answer: "",
    })),
  };

  return upsertSession(session);
};

export const createSpecificQuestionSession = (questionText, profile) => {
  const langue = profile?.langue || "fr";
  const poste = profile?.postes?.[0] || "Entraînement";

  const session = {
    id: `local-${Date.now()}`,
    source: "question_specifique",
    status: "en_cours",
    createdAt: new Date().toISOString(),
    finishedAt: null,
    poste,
    entreprise: "JobMentor",
    niveau: "intermediaire",
    difficulte: "normal",
    recruteur: "aria",
    surprises: false,
    duree: 10,
    langue,
    description: `Question spécifique : ${questionText}`,
    cvName: "",
    score: null,
    feedback: null,
    questions: [{ id: "q-1", text: questionText, answer: "" }],
  };

  return upsertSession(session);
};

// Calcule les étoiles d'une compétence à partir des sessions terminées
export const getCompetenceStars = (competenceId) => {
  const sessions = readSessions().filter(
    (s) => s.competenceId === competenceId && s.status === "terminee" && s.score !== null
  );
  if (sessions.length === 0) return 0;
  const avg = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length;
  if (avg >= 89) return 5;
  if (avg >= 76) return 4;
  if (avg >= 61) return 3;
  if (avg >= 41) return 2;
  if (avg >= 21) return 1;
  return 0;
};

// Retourne un objet { [competenceId]: { stars, sessions, avgScore, done } }
export const getAllCompetencesProgress = () => {
  const sessions = readSessions().filter(
    (s) => s.competenceId && s.status === "terminee"
  );
  const map = {};
  sessions.forEach((s) => {
    if (!map[s.competenceId]) {
      map[s.competenceId] = { scores: [], count: 0 };
    }
    map[s.competenceId].scores.push(s.score || 0);
    map[s.competenceId].count++;
  });
  const result = {};
  Object.entries(map).forEach(([id, data]) => {
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const stars = avg >= 89 ? 5 : avg >= 76 ? 4 : avg >= 61 ? 3 : avg >= 41 ? 2 : avg >= 21 ? 1 : 0;
    result[id] = {
      stars,
      sessions: data.count,
      avgScore: Math.round(avg),
      done: stars >= 3,
    };
  });
  return result;
};
