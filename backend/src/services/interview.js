import { z } from "zod";
import {
  DIFFICULT_INTERVIEW_QUESTIONS,
  SURPRISE_INTERVIEW_QUESTIONS,
} from "../constants.js";
import { hasOpenAI, parseStructuredResponse } from "../lib/openai.js";
import { cleanText, makeId, safeNumber, toLower } from "../lib/text.js";

const normalizeLanguage = (value) =>
  String(value || "fr").trim().toLowerCase() === "en" ? "en" : "fr";

const DIFFICULT_INTERVIEW_QUESTIONS_EN = [
  "Describe a decision you made with very little information.",
  "How would you react if your priorities changed three times in the same week?",
  "Give an example of how you convinced someone who disagreed with you.",
];

const SURPRISE_INTERVIEW_QUESTIONS_EN = [
  "If I asked your former manager about your biggest weakness, what would they say?",
  "Explain your job to someone who does not know your industry.",
];

const QUESTION_FOCUS = {
  fr: {
    presentation: "Structure, clarté et lien direct avec le poste",
    motivation: "Intérêt réel pour l'entreprise et le rôle",
    experience: "Impact concret et exemples mesurables",
    behavioral: "Méthode, recul et gestion des situations",
    technical: "Compréhension, précision et raisonnement",
    culture: "Collaboration, posture et adaptabilité",
    surprise: "Spontanéité, sincérité et capacité à rebondir",
    closure: "Curiosité et qualité des questions finales",
    general: "Réponse claire et naturelle",
  },
  en: {
    presentation: "Structure, clarity, and a direct link to the role",
    motivation: "Real interest in the company and the role",
    experience: "Concrete impact and measurable examples",
    behavioral: "Method, perspective, and situation handling",
    technical: "Understanding, precision, and reasoning",
    culture: "Collaboration, posture, and adaptability",
    surprise: "Spontaneity, honesty, and the ability to rebound",
    closure: "Curiosity and the quality of closing questions",
    general: "A clear and natural answer",
  },
};

const QUESTION_FOLLOW_UP = {
  fr: {
    presentation: "Pouvez-vous donner un exemple plus concret ?",
    motivation: "Qu'est-ce qui vous ferait rester dans ce poste sur le long terme ?",
    experience: "Quel a été votre apport personnel exact ?",
    behavioral: "Qu'avez-vous appris et que feriez-vous différemment ?",
    technical: "Comment valideriez-vous cette approche en production ?",
    culture: "Comment adaptez-vous votre façon de travailler à l'équipe ?",
    surprise: "Comment reformuleriez-vous votre réponse en 20 secondes ?",
    closure: "Quelle question poseriez-vous au recruteur ?",
    general: "Pouvez-vous aller encore plus au concret ?",
  },
  en: {
    presentation: "Could you give a more concrete example?",
    motivation: "What would make you stay in this role long term?",
    experience: "What exactly was your personal contribution?",
    behavioral: "What did you learn and what would you do differently?",
    technical: "How would you validate this approach in production?",
    culture: "How do you adapt your working style to the team?",
    surprise: "How would you rephrase your answer in 20 seconds?",
    closure: "What question would you ask the interviewer?",
    general: "Could you get even more concrete?",
  },
};

const QUESTION_TIPS = {
  fr: {
    presentation: [
      "Commencez par votre valeur ajoutée la plus pertinente.",
      "Évitez de réciter votre CV mot pour mot.",
    ],
    motivation: [
      "Reliez votre motivation au poste, pas seulement au salaire.",
      "Citez un point précis de l'entreprise ou du rôle.",
    ],
    experience: [
      "Donnez un résultat chiffré si possible.",
      "Expliquez votre contribution personnelle dans le succès.",
    ],
    behavioral: [
      "Décrivez le contexte, l'action et le résultat.",
      "Montrez votre capacité à prendre du recul.",
    ],
    technical: [
      "Soyez précis sur les choix techniques et les compromis.",
      "Expliquez comment vous vérifiez votre solution.",
    ],
    culture: [
      "Mettez en avant votre manière de collaborer.",
      "Montrez votre capacité d'adaptation à l'équipe.",
    ],
    surprise: [
      "Répondez simplement, sans chercher à trop surjouer.",
      "Assumez votre style personnel avec clarté.",
    ],
    closure: [
      "Posez une question qui montre votre curiosité.",
      "Évitez une question trop générique ou centrée sur le salaire.",
    ],
    general: [
      "Restez clair et concret.",
      "Terminez avec une conclusion courte.",
    ],
  },
  en: {
    presentation: [
      "Start with the most relevant value you bring.",
      "Avoid reciting your CV word for word.",
    ],
    motivation: [
      "Connect your motivation to the role, not just the salary.",
      "Mention a specific aspect of the company or the job.",
    ],
    experience: [
      "Give a quantified result when possible.",
      "Explain your personal contribution to the success.",
    ],
    behavioral: [
      "Describe the context, the action, and the result.",
      "Show that you can step back and reflect.",
    ],
    technical: [
      "Be precise about technical choices and trade-offs.",
      "Explain how you would validate your solution.",
    ],
    culture: [
      "Highlight your way of collaborating.",
      "Show how you adapt to the team.",
    ],
    surprise: [
      "Answer simply without overplaying it.",
      "Own your personal style with clarity.",
    ],
    closure: [
      "Ask a question that shows curiosity.",
      "Avoid a question that is too generic or salary-focused.",
    ],
    general: [
      "Stay clear and concrete.",
      "Finish with a short conclusion.",
    ],
  },
};

const questionSchema = z.object({
  text: z.string().min(1).describe("Texte complet de la question posée"),
  category: z.enum([
    "presentation",
    "motivation",
    "experience",
    "behavioral",
    "technical",
    "culture",
    "surprise",
    "closure",
    "general",
  ]).describe("Catégorie de la question d'entretien"),
  focus: z.string().min(1).describe("Ce sur quoi le candidat doit se concentrer pour répondre"),
  followUp: z.string().min(1).describe("Question de relance potentielle pour approfondir"),
  coachingTips: z.array(z.string()).min(2).describe("2 à 4 conseils de coaching pour bien répondre"),
});

const questionSetSchema = z.object({
  title: z.string().min(1).describe("Titre de la simulation d'entretien"),
  intro: z.string().min(1).describe("Introduction accueillante ou instructions de début de session"),
  coachTips: z.array(z.string()).min(3).describe("3 conseils de préparation généraux pour cette simulation"),
  questions: z.array(questionSchema).min(1).max(12).describe("Liste des questions personnalisées générées"),
});

const answerReviewSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Note globale de la réponse de 0 à 100 (ENTIER)"),
  clarity: z.number().int().min(0).max(100).describe("Score de clarté de 0 à 100 (ENTIER)"),
  relevance: z.number().int().min(0).max(100).describe("Score de pertinence vis-à-vis du poste de 0 à 100 (ENTIER)"),
  structure: z.number().int().min(0).max(100).describe("Score de structure de la réponse de 0 à 100 (ENTIER)"),
  confidence: z.number().int().min(0).max(100).describe("Score d'assurance et posture de 0 à 100 (ENTIER)"),
  summary: z.string().min(1).describe("Résumé constructif de l'évaluation de la réponse"),
  strengths: z.array(z.string()).min(1).describe("Points forts identifiés dans la réponse du candidat"),
  improvements: z.array(z.string()).min(1).describe("Axes d'amélioration ou manques identifiés dans la réponse"),
  followUpQuestion: z.string().min(1).describe("Question de relance pour rebondir sur sa réponse"),
  rewrittenAnswer: z.string().min(1).describe("Version optimisée et réécrite de sa réponse à titre d'exemple"),
  verdict: z.enum(["excellent", "good", "fair", "weak"]).describe("Verdict global qualitatif de la réponse"),
});

const sessionReviewSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Score global de la session d'entretien de 0 à 100 (ENTIER)"),
  summary: z.string().min(1).describe("Synthèse générale de la performance du candidat sur l'ensemble de la session"),
  strengths: z.array(z.string()).min(1).describe("Points forts majeurs observés durant la session"),
  improvements: z.array(z.string()).min(1).describe("Principaux axes de progression généraux"),
  nextSteps: z.array(z.string()).min(1).describe("Actions recommandées pour se préparer (ex: travailler STAR, préparer des chiffres)"),
  questionReviews: z.array(
    z.object({
      questionId: z.string().min(1).describe("ID de la question concernée"),
      score: z.number().int().min(0).max(100).describe("Note de la réponse de 0 à 100 (ENTIER)"),
      feedback: z.string().min(1).describe("Feedback concis et ciblé sur cette réponse"),
      strengths: z.array(z.string()).min(1).describe("Points forts de cette réponse spécifique"),
      improvements: z.array(z.string()).min(1).describe("Axes d'amélioration pour cette réponse spécifique"),
    })
  ).describe("Évaluations détaillées de chaque question répondue"),
});

const QUESTION_COUNT_BY_DURATION = (duration) =>
  safeNumber(duration, 10) >= 20 ? 10 : safeNumber(duration, 10) >= 15 ? 8 : 6;

const questionCategory = (text, index) => {
  const lower = toLower(text);
  if (
    lower.includes("présente") ||
    lower.includes("parlez-moi") ||
    lower.includes("tell me about yourself") ||
    lower.includes("introduce yourself")
  ) return "presentation";
  if (
    lower.includes("pourquoi") ||
    lower.includes("motivé") ||
    lower.includes("why are you interested") ||
    lower.includes("why do you want") ||
    lower.includes("why")
  ) return "motivation";
  if (
    lower.includes("réussite") ||
    lower.includes("expérience") ||
    lower.includes("achievement") ||
    lower.includes("success") ||
    lower.includes("accomplish")
  ) return "experience";
  if (
    lower.includes("difficult") ||
    lower.includes("gestion") ||
    lower.includes("conflit") ||
    lower.includes("challenge") ||
    lower.includes("problem")
  )
    return "behavioral";
  if (
    lower.includes("tech") ||
    lower.includes("compétence") ||
    lower.includes("architecture") ||
    lower.includes("technical") ||
    lower.includes("api") ||
    lower.includes("system")
  )
    return "technical";
  if (
    lower.includes("équipe") ||
    lower.includes("collabor") ||
    lower.includes("team")
  ) return "culture";
  if (
    lower.includes("question for the interviewer") ||
    lower.includes("question for the recruiter") ||
    lower.includes("question pertinente") ||
    lower.includes("question au recruteur") ||
    lower.includes("ask the interviewer") ||
    lower.includes("posez") ||
    lower.includes("recruteur") ||
    lower.includes("interviewer")
  ) return "closure";
  if (
    lower.includes("former manager") ||
    lower.includes("what would they say") ||
    lower.includes("explain your job") ||
    lower.includes("expliquez votre métier") ||
    lower.includes("métier") ||
    lower.includes("manager") ||
    lower.includes("surprise")
  )
    return "surprise";
  return index >= 6 ? "closure" : "general";
};

const questionFocus = (category, langue = "fr") =>
  QUESTION_FOCUS[normalizeLanguage(langue)]?.[category] ||
  QUESTION_FOCUS[normalizeLanguage(langue)]?.general ||
  QUESTION_FOCUS.fr.general;

const followUpFor = (category, langue = "fr") =>
  QUESTION_FOLLOW_UP[normalizeLanguage(langue)]?.[category] ||
  QUESTION_FOLLOW_UP[normalizeLanguage(langue)]?.general ||
  QUESTION_FOLLOW_UP.fr.general;

const tipsFor = (category, langue = "fr") =>
  QUESTION_TIPS[normalizeLanguage(langue)]?.[category] ||
  QUESTION_TIPS[normalizeLanguage(langue)]?.general ||
  QUESTION_TIPS.fr.general;

const buildFallbackQuestionSet = (context) => {
  const count = QUESTION_COUNT_BY_DURATION(context.duree);
  const language = normalizeLanguage(context.langue);
  const isEnglish = language === "en";
  const poste = context.poste ? String(context.poste).trim() : (isEnglish ? "this role" : "ce poste");
  const entreprise = context.entreprise ? String(context.entreprise).trim() : "";

  const baseList = isEnglish ? [
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

  const diffList = isEnglish ? DIFFICULT_INTERVIEW_QUESTIONS_EN : DIFFICULT_INTERVIEW_QUESTIONS;
  const surpriseList = isEnglish ? SURPRISE_INTERVIEW_QUESTIONS_EN : SURPRISE_INTERVIEW_QUESTIONS;

  const questions = [...baseList];

  if (context.difficulte === "difficile") {
    questions.splice(4, 0, ...diffList);
  }

  if (context.surprises) {
    questions.splice(3, 0, ...surpriseList);
  }

  const selected = questions.slice(0, count).map((text, index) => {
    const category = questionCategory(text, index);
    return {
      id: makeId("q"),
      text,
      category,
      focus: questionFocus(category, language),
      followUp: followUpFor(category, language),
      coachingTips: tipsFor(category, language),
    };
  });

  return {
    title: language === "en"
      ? "Tailored interview practice"
      : "Simulation d'entretien personnalisée",
    intro: language === "en"
      ? `Practice for the ${context.poste || "target role"} position${context.entreprise ? ` at ${context.entreprise}` : ""}.`
      : `Entraînement ciblé pour le poste ${context.poste || "visé"}${context.entreprise ? ` chez ${context.entreprise}` : ""}.`,
    coachTips: language === "en"
      ? [
          "Answer in short, specific chunks.",
          "Use one concrete example for each key point.",
          "Finish with a clear outcome or lesson learned.",
        ]
      : [
          "Répondez par blocs courts et précis.",
          "Donnez un exemple concret à chaque point important.",
          "Terminez par un résultat ou une leçon claire.",
        ],
    questions: selected,
  };
};

const normalizeQuestionSet = (output, context) => {
  const fallback = buildFallbackQuestionSet(context);
  const count = QUESTION_COUNT_BY_DURATION(context.duree);
  const language = normalizeLanguage(context.langue);
  const questions = (output.questions || fallback.questions)
    .slice(0, count)
    .map((question, index) => ({
      id: makeId("q"),
      text: cleanText(question.text || fallback.questions[index]?.text || ""),
      category: question.category || questionCategory(question.text || "", index),
      focus: cleanText(question.focus || fallback.questions[index]?.focus || questionFocus(questionCategory(question.text || "", index), language)),
      followUp: cleanText(question.followUp || fallback.questions[index]?.followUp || followUpFor(questionCategory(question.text || "", index), language)),
      coachingTips: Array.isArray(question.coachingTips) && question.coachingTips.length
        ? question.coachingTips.map((tip) => cleanText(tip)).filter(Boolean)
        : fallback.questions[index]?.coachingTips || tipsFor(questionCategory(question.text || "", index), language),
    }))
    .filter((question) => question.text.length > 0);

  while (questions.length < count) {
    const fallbackQuestion = fallback.questions[questions.length % fallback.questions.length];
    questions.push({
      ...fallbackQuestion,
      id: makeId("q"),
    });
  }

  return {
    title: cleanText(output.title || fallback.title),
    intro: cleanText(output.intro || fallback.intro),
    coachTips:
      Array.isArray(output.coachTips) && output.coachTips.length
        ? output.coachTips.map((tip) => cleanText(tip)).filter(Boolean)
        : fallback.coachTips,
    questions,
  };
};

const buildFallbackAnswerReview = (context) => {
  const answer = cleanText(context.answer);
  const language = normalizeLanguage(context.langue);
  const isEnglish = language === "en";
  const lengthScore = Math.min(35, Math.round(answer.length / 10));
  const structureScore = /d'abord|ensuite|puis|enfin|par exemple|concrètement|first|then|next|finally|for example|concretely/i.test(answer)
    ? 20
    : 8;
  const relevanceScore = answer.length > 80 ? 25 : answer.length > 30 ? 18 : 8;
  const confidenceScore = /je pense|je crois|j'ai|je peux|je sais|i think|i believe|i have|i can|i know/i.test(answer) ? 15 : 8;
  const score = Math.min(100, lengthScore + structureScore + relevanceScore + confidenceScore + 10);

  const verdict =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "weak";

  return {
    score,
    clarity: Math.min(100, score - 5),
    relevance: Math.min(100, score - 3),
    structure: Math.min(100, structureScore * 4),
    confidence: Math.min(100, confidenceScore * 6),
    summary: answer.length === 0
      ? (isEnglish ? "No answer provided." : "Réponse non renseignée.")
      : (isEnglish
        ? "The answer is understandable, but it would benefit from more structure and concrete evidence."
        : "Réponse cohérente, mais elle gagnerait à être plus structurée et plus illustrée."),
    strengths: answer.length > 0
      ? (isEnglish ? ["The answer is engaged", "The topic is addressed"] : ["La réponse est engagée", "Le sujet est traité"])
      : (isEnglish ? ["No content provided"] : ["Aucun contenu saisi"]),
    improvements: answer.length > 0
      ? (isEnglish ? ["Add a concrete example", "End with measurable impact"] : ["Ajoutez un exemple concret", "Concluez par un impact mesurable"])
      : (isEnglish ? ["Write a complete answer", "Add a concrete example"] : ["Rédigez une réponse complète", "Ajoutez un exemple concret"]),
    followUpQuestion: isEnglish
      ? "Could you give a concrete example?"
      : "Pouvez-vous donner un exemple concret ?",
    rewrittenAnswer: isEnglish
      ? "Use the STAR method: situation, task, action, result."
      : "Structurez votre réponse avec la méthode STAR: situation, tâche, action, résultat.",
    verdict,
  };
};

const normalizeAnswerReview = (review, context) => ({
  score: review.score ?? 0,
  clarity: review.clarity ?? review.score ?? 0,
  relevance: review.relevance ?? review.score ?? 0,
  structure: review.structure ?? review.score ?? 0,
  confidence: review.confidence ?? review.score ?? 0,
  summary: cleanText(review.summary || ""),
  strengths: Array.isArray(review.strengths) && review.strengths.length
    ? review.strengths.map((item) => cleanText(item)).filter(Boolean)
    : buildFallbackAnswerReview(context).strengths,
  improvements: Array.isArray(review.improvements) && review.improvements.length
    ? review.improvements.map((item) => cleanText(item)).filter(Boolean)
    : buildFallbackAnswerReview(context).improvements,
  followUpQuestion: cleanText(review.followUpQuestion || ""),
  rewrittenAnswer: cleanText(review.rewrittenAnswer || ""),
  verdict: review.verdict || "fair",
});

const buildFallbackSessionReview = (session) => {
  const questions = Array.isArray(session.questions) ? session.questions : [];
  const language = normalizeLanguage(session.langue);
  const isEnglish = language === "en";
  const answeredQuestions = questions.filter((question) =>
    cleanText(question.answer).length > 0
  );
  const answered = answeredQuestions.length;
  const total = questions.length;
  const completion = answered / Math.max(total, 1);
  const averageLength = answeredQuestions.reduce(
    (sum, question) => sum + cleanText(question.answer).length,
    0
  ) / Math.max(answered, 1);
  const depthBonus = Math.min(20, Math.round(averageLength / 18));
  const score = Math.min(100, Math.round(completion * 70 + depthBonus));

  const questionReviews = questions.map((question, index) => {
    const answer = cleanText(question.answer);
    const localScore = answer.length
      ? Math.min(100, 40 + Math.round(answer.length / 10))
      : 0;

    return {
      questionId: question.id || `q-${index + 1}`,
      score: localScore,
      feedback: answer.length > 0
        ? (isEnglish
          ? "The answer is relevant, but it needs more precision and examples."
          : "Réponse correcte, mais il faut un peu plus de précision et d'exemples.")
        : (isEnglish ? "Question not answered." : "Question non traitée."),
      strengths: answer.length > 0
        ? (isEnglish ? ["Engaged answer", "Clear intent"] : ["Réponse engagée", "Intention claire"])
        : (isEnglish ? ["No answer provided"] : ["Aucune réponse"]),
      improvements: answer.length > 0
        ? (isEnglish ? ["Add numbers or facts", "Use a clearer structure"] : ["Ajoutez des chiffres ou des faits", "Utilisez une structure plus nette"])
        : (isEnglish ? ["Prepare a complete answer"] : ["Préparez une réponse complète"]),
    };
  });

  return {
    score,
    summary: score >= 75
      ? (isEnglish
        ? "Overall structure is strong. Keep illustrating your answers with specific examples."
        : "Bonne structure générale. Continuez à illustrer vos réponses avec des exemples précis.")
      : (isEnglish
        ? "The foundation is solid. Focus mainly on example precision and the conclusion of each answer."
        : "Base correcte. Travaillez surtout la précision des exemples et la conclusion de chaque réponse."),
    strengths: answered > 0
      ? (isEnglish
        ? ["Answers are generally present", "Progress is visible"]
        : ["Les réponses sont globalement présentes", "La progression est visible"])
      : (isEnglish ? ["The session has been opened"] : ["La session a été ouverte"]),
    improvements: answered > 0
      ? (isEnglish
        ? [
            "Add more concrete examples",
            "Structure your conclusions more clearly",
            "Strengthen the impact of your achievements",
          ]
        : [
            "Ajoutez des exemples plus concrets",
            "Structurez mieux vos conclusions",
            "Renforcez l'impact de vos réalisations",
          ])
      : (isEnglish ? ["Answer more questions"] : ["Répondez à davantage de questions"]),
    nextSteps: isEnglish
      ? [
          "Replay the session with a stricter STAR method.",
          "Prepare 2 to 3 quantified examples per key skill.",
        ]
      : [
          "Rejouez la session avec une méthode STAR plus stricte.",
          "Préparez 2 à 3 exemples chiffrés par compétence clé.",
        ],
    questionReviews,
    answered,
    total,
  };
};

const normalizeSessionReview = (review, session) => {
  const language = normalizeLanguage(session.langue);
  const isEnglish = language === "en";
  const fallback = buildFallbackSessionReview(session);

  return {
    score: review.score ?? 0,
    summary: cleanText(review.summary || ""),
    strengths: Array.isArray(review.strengths) && review.strengths.length
      ? review.strengths.map((item) => cleanText(item)).filter(Boolean)
      : fallback.strengths,
    improvements: Array.isArray(review.improvements) && review.improvements.length
      ? review.improvements.map((item) => cleanText(item)).filter(Boolean)
      : fallback.improvements,
    nextSteps: Array.isArray(review.nextSteps) && review.nextSteps.length
      ? review.nextSteps.map((item) => cleanText(item)).filter(Boolean)
      : fallback.nextSteps,
    questionReviews: Array.isArray(review.questionReviews)
      ? review.questionReviews.map((item, index) => ({
          questionId: cleanText(item.questionId || `q-${index + 1}`),
          score: safeNumber(item.score, 0),
          feedback: cleanText(item.feedback || ""),
          strengths: Array.isArray(item.strengths) && item.strengths.length
            ? item.strengths.map((value) => cleanText(value)).filter(Boolean)
            : [isEnglish ? "Relevant answer" : "Réponse pertinente"],
          improvements: Array.isArray(item.improvements) && item.improvements.length
            ? item.improvements.map((value) => cleanText(value)).filter(Boolean)
            : [isEnglish ? "Needs more detail" : "Réponse à détailler"],
        }))
      : fallback.questionReviews,
    answered: review.answered ?? fallback.answered,
    total: review.total ?? fallback.total,
  };
};

export const generateInterviewQuestions = async (context) => {
  const count = QUESTION_COUNT_BY_DURATION(context.duree);
  const fallback = buildFallbackQuestionSet(context);

  if (hasOpenAI) {
    try {
      const output = await parseStructuredResponse({
        schema: questionSetSchema,
        name: "interview_questions",
        system:
          context.langue === "en"
            ? "You are an expert interview coach. Produce concise, natural interview questions tailored to the role and the recruiter personality. Always respond in the language requested."
            : "Tu es un coach d'entretien expert. Produis des questions naturelles, ciblées et adaptées au poste, à la personnalité du recruteur et au niveau demandé. Réponds toujours dans la langue demandée.",
        user: JSON.stringify({
          count,
          context: {
            poste: context.poste || "",
            entreprise: context.entreprise || "",
            niveau: context.niveau || "",
            difficulte: context.difficulte || "",
            recruteur: context.recruteur || "",
            surprises: Boolean(context.surprises),
            duree: safeNumber(context.duree, 10),
            langue: context.langue || "fr",
            description: context.description || "",
            cvSummary: context.cvSummary || "",
            skills: Array.isArray(context.skills) ? context.skills : [],
          },
        }),
      });

      if (output) {
        return normalizeQuestionSet(output, context);
      }
    } catch {
      // Fallback below.
    }
  }

  return fallback;
};

export const analyzeInterviewAnswer = async (context) => {
  const fallback = buildFallbackAnswerReview(context);

  if (hasOpenAI && cleanText(context.answer).length > 0) {
    try {
      const output = await parseStructuredResponse({
        schema: answerReviewSchema,
        name: "interview_answer_review",
        system:
          context.langue === "en"
            ? "You are an interview reviewer. Assess the answer with a recruiter mindset, stay concise, and return practical feedback."
            : "Tu évalues une réponse d'entretien avec un regard de recruteur. Sois concis, concret et orienté action.",
        user: JSON.stringify({
          question: context.question || "",
          answer: context.answer || "",
          poste: context.poste || "",
          entreprise: context.entreprise || "",
          niveau: context.niveau || "",
          difficulte: context.difficulte || "",
          recruteur: context.recruteur || "",
          langue: context.langue || "fr",
        }),
      });

      if (output) {
        return normalizeAnswerReview(output, context);
      }
    } catch {
      // Fallback below.
    }
  }

  return fallback;
};

export const analyzeInterviewSession = async (session) => {
  const fallback = buildFallbackSessionReview(session);
  const questions = Array.isArray(session.questions) ? session.questions : [];
  const answered = questions.filter((question) => cleanText(question.answer).length > 0).length;
  const total = questions.length;

  if (hasOpenAI && answered > 0) {
    try {
      const output = await parseStructuredResponse({
        schema: sessionReviewSchema,
        name: "interview_session_review",
        system:
          session.langue === "en"
            ? "You are an interview debrief specialist. Review the candidate's answers from a recruiter perspective and provide a concise, useful final evaluation."
            : "Tu es un spécialiste du débrief d'entretien. Analyse les réponses du candidat avec le regard d'un recruteur et fournis un retour final utile et concis.",
        user: JSON.stringify({
          poste: session.poste || "",
          entreprise: session.entreprise || "",
          niveau: session.niveau || "",
          difficulte: session.difficulte || "",
          recruteur: session.recruteur || "",
          langue: session.langue || "fr",
          description: session.description || "",
          cvName: session.cvName || "",
          questions: questions.map((question, index) => ({
            questionId: question.id || `q-${index + 1}`,
            text: question.text || "",
            answer: question.answer || "",
            analysis: question.analysis || null,
          })),
        }),
      });

      if (output) {
        const review = normalizeSessionReview(output, session);
        return {
          ...review,
          answered,
          total,
        };
      }
    } catch {
      // Fallback below.
    }
  }

  return fallback;
};

export const buildInterviewSessionQuestions = async (context) =>
  generateInterviewQuestions(context);
