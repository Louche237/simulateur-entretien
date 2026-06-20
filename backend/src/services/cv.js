import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import {
  ROLE_KEYWORDS,
  SKILLS_POOL,
  SOFT_KEYWORDS,
  TECH_KEYWORDS,
} from "../constants.js";
import { hasOpenAI, parseStructuredResponse } from "../lib/openai.js";
import {
  cleanText,
  safeNumber,
  toLower,
  truncateText,
} from "../lib/text.js";

const execFile = promisify(execFileCallback);

const educationSchema = z.object({
  diplome: z.string().min(1).describe("Nom du diplôme ou de la formation (ex: Master en Informatique)"),
  ecole: z.string().min(1).describe("Nom de l'école ou université (ex: Université de Paris)"),
  annee: z.string().min(1).describe("Année d'obtention ou de diplomation (ex: 2022 ou En cours)"),
});

const experienceSchema = z.object({
  poste: z.string().min(1).describe("Intitulé du poste occupé (ex: Développeur React)"),
  entreprise: z.string().min(1).describe("Nom de l'entreprise ou employeur (ex: TechCorp)"),
  duree: z.string().min(1).describe("Durée de l'expérience (ex: 2 ans, ou Jan 2020 - Présent)"),
  missions: z.array(z.string()).min(1).describe("Liste de 2 à 5 missions ou réalisations principales"),
});

const cvExtractionSchema = z.object({
  title: z.string().min(1).describe("Titre professionnel global recherché ou actuel (ex: Développeur Full-Stack)"),
  summary: z.string().min(1).describe("Court paragraphe résumant le profil et les compétences clés"),
  skills: z.array(z.string()).min(1).describe("Liste de 4 à 10 compétences techniques et soft skills du candidat"),
  experiences: z.array(experienceSchema).min(0).describe("Expériences professionnelles listées"),
  education: z.array(educationSchema).min(0).describe("Formations et diplômes listés"),
});

const cvAnalysisSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Score de compatibilité global de 0 à 100 sous forme d'ENTIER"),
  niveau: z.enum(["Excellente", "Bonne", "Partielle", "Faible"]).describe("Niveau d'adéquation global"),
  couleur: z.string().min(1).describe("Code hex de couleur correspondant au niveau : #22c55e (Excellente), #f59e0b (Bonne), #f97316 (Partielle), #ef4444 (Faible)"),
  matched: z.array(z.string()).min(0).describe("Compétences du candidat qui matchent avec les mots-clés de l'offre"),
  missing: z.array(z.string()).min(0).describe("Mots-clés et compétences importantes de l'offre manquants dans le CV"),
  recommendations: z.array(z.string()).min(1).describe("Recommandations concrètes d'amélioration sous forme de tableau de chaînes"),
  suggestedTitle: z.string().min(1).describe("Titre de poste adapté suggéré pour matcher l'offre"),
  adaptedSummary: z.string().min(1).describe("Résumé professionnel réécrit et adapté pour matcher au mieux l'offre d'emploi"),
  highlightedSkills: z.array(z.string()).min(0).describe("Compétences clés de l'offre à mettre en valeur en priorité"),
  adaptedExperiences: z.array(experienceSchema).min(0).describe("Expériences professionnelles réécrites/mises en valeur pour matcher au mieux les mots-clés de l'offre"),
  fitSummary: z.string().min(1).describe("Court paragraphe synthétisant l'adéquation globale du profil avec le poste"),
});

const TECH_SET = TECH_KEYWORDS.map((value) => value.toLowerCase());
const SOFT_SET = SOFT_KEYWORDS.map((value) => value.toLowerCase());

const detectRole = (text) => {
  const lower = toLower(text);
  const found = ROLE_KEYWORDS.find((entry) =>
    entry.match.some((needle) => lower.includes(needle))
  );
  return found?.value || "Développeur Full-Stack";
};

const detectSkills = (text) => {
  const lower = toLower(text);
  const pool = [...SKILLS_POOL].filter((skill) =>
    lower.includes(skill.toLowerCase())
  );
  const tech = TECH_SET.filter((skill) => lower.includes(skill)).map((skill) => {
    const original = SKILLS_POOL.find(
      (entry) => entry.toLowerCase() === skill.replace(/\./g, ".")
    );
    return original || skill;
  });
  const soft = SOFT_SET.filter((skill) => lower.includes(skill)).map((skill) => {
    const original = SKILLS_POOL.find(
      (entry) => entry.toLowerCase() === skill
    );
    return original || skill;
  });
  return [...new Set([...pool, ...tech, ...soft])].slice(0, 8);
};

const detectYear = (text) => {
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : "2021";
};

const fallbackCvData = (text, fileName = "cv") => {
  const skills = detectSkills(text);
  const title = detectRole(text);
  const focusSkills = skills.slice(0, 3).join(", ") || "développement logiciel";

  return {
    rawName: fileName,
    title,
    summary:
      `Professionnel avec une solide expérience en ${focusSkills}. ` +
      "Capable de concevoir et déployer des solutions techniques robustes et évolutives. " +
      "Orienté résultats avec de bonnes compétences en communication et travail d'équipe.",
    skills: skills.length
      ? skills
      : ["JavaScript", "React", "Node.js", "SQL"],
    experiences: [
      {
        poste: title,
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
        ecole: "Université",
        annee: detectYear(text),
      },
    ],
  };
};

const normalizeCvData = (payload, fileName, fallbackText) => {
  const fallback = fallbackCvData(fallbackText, fileName);
  const experiences = Array.isArray(payload.experiences)
    ? payload.experiences.map((exp, index) => ({
        poste: cleanText(exp.poste || fallback.experiences[index]?.poste || "Expérience"),
        entreprise: cleanText(exp.entreprise || fallback.experiences[index]?.entreprise || "Entreprise"),
        duree: cleanText(exp.duree || fallback.experiences[index]?.duree || "1 an"),
        missions: Array.isArray(exp.missions) && exp.missions.length
          ? exp.missions.map((mission) => cleanText(mission)).filter(Boolean)
          : fallback.experiences[index]?.missions || [],
      }))
    : fallback.experiences;

  const education = Array.isArray(payload.education)
    ? payload.education.map((item, index) => ({
        diplome: cleanText(item.diplome || fallback.education[index]?.diplome || "Diplôme"),
        ecole: cleanText(item.ecole || fallback.education[index]?.ecole || "Établissement"),
        annee: cleanText(item.annee || fallback.education[index]?.annee || "2021"),
      }))
    : fallback.education;

  return {
    rawName: fileName,
    title: cleanText(payload.title || fallback.title),
    summary: cleanText(payload.summary || fallback.summary),
    skills: Array.isArray(payload.skills) && payload.skills.length
      ? [...new Set(payload.skills.map((skill) => cleanText(skill)).filter(Boolean))]
      : fallback.skills,
    experiences,
    education,
  };
};

const normalizeQuestionOrSkillList = (value) =>
  Array.isArray(value) ? [...new Set(value.map((item) => cleanText(item)).filter(Boolean))] : [];

const normalizeOfferInsights = (insights, offer) => {
  const fallback =
    getOfferInsights(offer) || {
      keywords: [],
      niveau: "Intermédiaire",
      typePoste: "Général",
      salaire: null,
    };
  const keywords = normalizeQuestionOrSkillList(insights?.keywords);
  return {
    keywords: keywords.length ? keywords.slice(0, 10) : fallback.keywords,
    niveau: insights?.niveau || fallback.niveau,
    typePoste: cleanText(insights?.typePoste || fallback.typePoste),
    salaire: insights?.salaire || fallback.salaire,
  };
};

const scoreLevel = (score) =>
  score >= 75 ? "Excellente" : score >= 55 ? "Bonne" : score >= 35 ? "Partielle" : "Faible";

const scoreColor = (score) =>
  score >= 75 ? "#22c55e" : score >= 55 ? "#f59e0b" : score >= 35 ? "#f97316" : "#ef4444";

export function getOfferInsights(offre) {
  if (!offre || String(offre).trim().length < 20) return null;

  const lower = toLower(offre);
  const keywords = [
    ...TECH_KEYWORDS.filter((keyword) => lower.includes(keyword)),
    ...SOFT_KEYWORDS.filter((keyword) => lower.includes(keyword)),
  ].slice(0, 10);

  const niveau = lower.includes("senior") || lower.includes("confirmé")
    ? "Senior"
    : lower.includes("junior") || lower.includes("débutant")
      ? "Junior"
      : "Intermédiaire";

  const typePoste = lower.includes("frontend")
    ? "Frontend"
    : lower.includes("backend")
      ? "Backend"
      : lower.includes("full-stack") || lower.includes("fullstack")
        ? "Full-Stack"
        : lower.includes("data")
          ? "Data"
          : lower.includes("devops")
            ? "DevOps"
            : "Général";

  const salaryMatch = offre.match(/(\d{2,3})[\s]?k/i);
  const salaire = salaryMatch ? `${salaryMatch[1]}k€` : null;

  return { keywords, niveau, typePoste, salaire };
}

export function scoreCVAgainstOffer(cvData, offre) {
  if (!cvData || !offre) return null;

  const lower = toLower(offre);
  const skills = Array.isArray(cvData.skills) ? cvData.skills : [];
  const cvSkillsLower = skills.map((skill) => skill.toLowerCase());

  const matched = skills.filter((skill) => lower.includes(skill.toLowerCase()));
  const offerInsights = getOfferInsights(offre);
  const missing = (offerInsights?.keywords || []).filter(
    (keyword) =>
      !cvSkillsLower.some(
        (skill) => skill.includes(keyword) || keyword.includes(skill)
      )
  );

  const matchRatio = matched.length / Math.max(skills.length, 1);
  const keywordRatio = offerInsights?.keywords.length
    ? matched.length / offerInsights.keywords.length
    : 0;
  const score = Math.min(100, Math.round(matchRatio * 40 + keywordRatio * 60));
  const niveau = scoreLevel(score);
  const couleur = scoreColor(score);

  const recommendations = [];
  if (missing.length > 0) {
    recommendations.push(
      `Ajoutez ces compétences manquantes : ${missing.slice(0, 3).join(", ")}`
    );
  }
  if (matched.length < 3) {
    recommendations.push(
      "Reformulez votre résumé en intégrant les termes de l'offre"
    );
  }
  if (!lower.includes(toLower(cvData.title || ""))) {
    recommendations.push("Adaptez votre titre professionnel au poste visé");
  }
  if ((cvData.experiences || []).length < 2) {
    recommendations.push("Détaillez davantage vos expériences professionnelles");
  }
  recommendations.push("Quantifiez vos réalisations avec des chiffres concrets");
  recommendations.push("Personnalisez votre lettre de motivation pour ce poste");

  return { score, niveau, couleur, matched, missing, recommendations };
}

export function generateAdaptedCV(cvData, offre) {
  const insights = getOfferInsights(offre);
  const score = scoreCVAgainstOffer(cvData, offre);
  const skills = Array.isArray(cvData.skills) ? cvData.skills : [];

  const highlightedSkills = [
    ...skills.filter((skill) => toLower(offre).includes(skill.toLowerCase())),
    ...(insights?.keywords || [])
      .filter((keyword) => !skills.some((skill) => skill.toLowerCase() === keyword))
      .slice(0, 3),
  ].slice(0, 8);

  const suggestedTitle =
    insights?.typePoste !== "Général"
      ? `${insights.typePoste} Developer ${insights.niveau}`
      : cvData.title || "Développeur";

  const keywordsInSummary = (insights?.keywords || []).slice(0, 3).join(", ");
  const adaptedSummary =
    `Professionnel ${insights?.niveau || ""} spécialisé en ${keywordsInSummary || "développement logiciel"}, ` +
    "avec une expérience démontrée dans la conception et le déploiement de solutions techniques. " +
    `${score && score.matched.length > 0 ? `Compétences validées : ${score.matched.slice(0, 3).join(", ")}.` : ""} ` +
    "Orienté résultats, autonome et capable de m'intégrer rapidement dans une équipe.";

  const adaptedExperiences = (cvData.experiences || []).map((experience) => ({
    ...experience,
    missions: (experience.missions || []).map((mission) => {
      const keyword = insights?.keywords.find((item) =>
        toLower(mission).includes(toLower(item))
      );
      return keyword ? `${mission} (${keyword})` : mission;
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

const withTimeout = (promise, ms, timeoutErrorMsg = "Operation timed out") => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutErrorMsg)), ms)),
  ]);
};

async function loadPdfParse() {
  const mod = await import("pdf-parse");
  return mod.default || mod;
}

async function loadMammoth() {
  const mod = await import("mammoth");
  return mod.default || mod;
}

const extractTextFromPdf = async (buffer) => {
  const pdfParse = await loadPdfParse();
  const result = await withTimeout(pdfParse(buffer), 10000, "PDF parsing timed out");
  return cleanText(result.text || "");
};

const extractTextFromDocx = async (buffer) => {
  const mammoth = await loadMammoth();
  const result = await withTimeout(mammoth.extractRawText({ buffer }), 10000, "DOCX parsing timed out");
  return cleanText(result.value || "");
};

const extractTextFromDoc = async (buffer, fileName) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobmentor-cv-"));
  const outDir = path.join(tempDir, "out");
  fs.mkdirSync(outDir);
  const inputPath = path.join(tempDir, fileName);
  fs.writeFileSync(inputPath, buffer);

  try {
    await execFile("libreoffice", [
      "--headless",
      "--convert-to",
      "txt:Text",
      "--outdir",
      outDir,
      inputPath,
    ], {
      timeout: 15000, // 15 seconds timeout
      killSignal: "SIGKILL",
    });

    const generatedFile = fs
      .readdirSync(outDir)
      .find((entry) => entry.toLowerCase().endsWith(".txt"));

    if (!generatedFile) return "";
    return cleanText(fs.readFileSync(path.join(outDir, generatedFile), "utf8"));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

export async function extractTextFromUpload(file) {
  if (!file?.buffer) return "";

  const name = file.originalname || "cv";
  const mime = file.mimetype || "";
  const extension = path.extname(name).toLowerCase();

  try {
    if (mime === "application/pdf" || extension === ".pdf") {
      return await extractTextFromPdf(file.buffer);
    }

    if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === ".docx"
    ) {
      return await extractTextFromDocx(file.buffer);
    }

    if (mime === "application/msword" || extension === ".doc") {
      return await extractTextFromDoc(file.buffer, name);
    }
  } catch (error) {
    console.error("Erreur lors de l'extraction de texte du CV, utilisation du format brut :", error);
  }

  try {
    return cleanText(file.buffer.toString("utf8"));
  } catch {
    return "";
  }
}

// Remplace buildAIExtraction (ligne ~400)
const buildAIExtraction = async (rawText, fileName, langue = "fr") => {
  if (!hasOpenAI || cleanText(rawText).length === 0) return null;

  try {
    const output = await parseStructuredResponse({
      schema: cvExtractionSchema,
      name: "cv_extraction",
      system:
        langue === "en"
          ? "You are a CV extraction assistant. Extract structured data from the resume below. Do not invent details not present in the text. Respond ONLY in valid JSON, no markdown."
          : "Tu es un assistant d'extraction de CV. Extrais les données structurées du CV ci-dessous. Ne pas inventer des éléments absents du texte. Réponds UNIQUEMENT en JSON valide, sans markdown.",
      user:
        langue === "en"
          ? `File name: ${fileName}\n\nResume content:\n${truncateText(rawText, 14000)}`
          : `Nom du fichier : ${fileName}\n\nContenu du CV :\n${truncateText(rawText, 14000)}`,
    });

    if (output) {
      return normalizeCvData(output, fileName, rawText);
    }
  } catch {
    // Fallback below.
  }

  return null;
};
export async function extractCvDataFromUpload(file, { langue = "fr" } = {}) {
  const rawText = await extractTextFromUpload(file);
  const fileName = file?.originalname || "cv";
  const aiData = await buildAIExtraction(rawText, fileName, langue);

  if (aiData) {
    return aiData;
  }

  return normalizeCvData(fallbackCvData(rawText, fileName), fileName, rawText);
}

// Remplace buildAIAnalysis (ligne ~440)
const buildAIAnalysis = async ({ cvData, offer, offerInsights, langue = "fr" }) => {
  if (!hasOpenAI) return null;

  try {
    const cvText =
      langue === "en"
        ? `CANDIDATE PROFILE:
Title: ${cvData.title || ""}
Summary: ${cvData.summary || ""}
Skills: ${(cvData.skills || []).join(", ")}
Experience: ${(cvData.experiences || []).map((e) => `${e.poste} at ${e.entreprise} (${e.duree}): ${(e.missions || []).join("; ")}`).join(" | ")}
Education: ${(cvData.education || []).map((e) => `${e.diplome} - ${e.ecole} (${e.annee})`).join(" | ")}

JOB OFFER:
${truncateText(offer, 8000)}

OFFER INSIGHTS:
Keywords: ${(offerInsights?.keywords || []).join(", ")}
Level: ${offerInsights?.niveau || ""}
Type: ${offerInsights?.typePoste || ""}`
        : `PROFIL DU CANDIDAT :
Titre : ${cvData.title || ""}
Résumé : ${cvData.summary || ""}
Compétences : ${(cvData.skills || []).join(", ")}
Expériences : ${(cvData.experiences || []).map((e) => `${e.poste} chez ${e.entreprise} (${e.duree}) : ${(e.missions || []).join(" ; ")}`).join(" | ")}
Formation : ${(cvData.education || []).map((e) => `${e.diplome} - ${e.ecole} (${e.annee})`).join(" | ")}

OFFRE D'EMPLOI :
${truncateText(offer, 8000)}

ANALYSE DE L'OFFRE :
Mots-clés : ${(offerInsights?.keywords || []).join(", ")}
Niveau : ${offerInsights?.niveau || ""}
Type de poste : ${offerInsights?.typePoste || ""}`;

    const output = await parseStructuredResponse({
      schema: cvAnalysisSchema,
      name: "cv_analysis",
      system:
        langue === "en"
          ? "You are a recruiter and CV coach. Compare the CV to the job offer, identify matches and gaps, then provide a tailored adapted version. For 'couleur', always return a valid hex color: #22c55e for Excellente, #f59e0b for Bonne, #f97316 for Partielle, #ef4444 for Faible. Respond ONLY in valid JSON."
          : "Tu es un recruteur et coach CV. Compare le CV à l'offre, identifie les correspondances et les manques, puis propose une version adaptée. Pour 'couleur', retourne toujours un code hex valide : #22c55e pour Excellente, #f59e0b pour Bonne, #f97316 pour Partielle, #ef4444 pour Faible. Réponds UNIQUEMENT en JSON valide.",
      user: cvText,
    });

    if (output) {
      // Recalcul défensif de couleur si le modèle retourne autre chose qu'un hex
      if (output.couleur && !output.couleur.startsWith("#")) {
        output.couleur = scoreColor(safeNumber(output.score, 0));
      }
      return output;
    }
  } catch {
    // Fallback below.
  }

  return null;
};

export async function analyzeCvProfile({ cvData, offer, langue = "fr" }) {
  const normalizedCv = normalizeCvData(
    cvData || fallbackCvData("", "cv"),
    cvData?.rawName || "cv",
    ""
  );
  const offerInsights = normalizeOfferInsights(getOfferInsights(offer), offer);
  const fallbackAnalysis = scoreCVAgainstOffer(normalizedCv, offer) || {
    score: 0,
    niveau: "Faible",
    couleur: "#ef4444",
    matched: [],
    missing: [],
    recommendations: [
      "Complétez votre CV avec davantage de compétences ciblées",
      "Ajoutez des résultats mesurables",
    ],
  };
  const fallbackAdapted = generateAdaptedCV(normalizedCv, offer);
  const aiOutput = await buildAIAnalysis({
    cvData: normalizedCv,
    offer,
    offerInsights,
    langue,
  });

  if (!aiOutput) {
    return {
      cvData: normalizedCv,
      offerInsights,
      analysis: fallbackAnalysis,
      adapted: fallbackAdapted,
    };
  }

  const analysis = {
    score: safeNumber(aiOutput.score, fallbackAnalysis.score || 0),
    niveau: aiOutput.niveau || fallbackAnalysis.niveau,
    couleur: aiOutput.couleur || scoreColor(safeNumber(aiOutput.score, fallbackAnalysis.score || 0)),
    matched: normalizeQuestionOrSkillList(aiOutput.matched),
    missing: normalizeQuestionOrSkillList(aiOutput.missing),
    recommendations:
      Array.isArray(aiOutput.recommendations) && aiOutput.recommendations.length
        ? aiOutput.recommendations.map((item) => cleanText(item)).filter(Boolean)
        : fallbackAnalysis.recommendations,
  };

  const adapted = {
    suggestedTitle: cleanText(aiOutput.suggestedTitle || fallbackAdapted.suggestedTitle),
    adaptedSummary: cleanText(aiOutput.adaptedSummary || fallbackAdapted.adaptedSummary),
    highlightedSkills:
      normalizeQuestionOrSkillList(aiOutput.highlightedSkills).length > 0
        ? normalizeQuestionOrSkillList(aiOutput.highlightedSkills)
        : fallbackAdapted.highlightedSkills,
    adaptedExperiences:
      Array.isArray(aiOutput.adaptedExperiences) && aiOutput.adaptedExperiences.length
        ? aiOutput.adaptedExperiences.map((experience, index) => ({
            poste: cleanText(experience.poste || fallbackAdapted.adaptedExperiences[index]?.poste || "Expérience"),
            entreprise: cleanText(experience.entreprise || fallbackAdapted.adaptedExperiences[index]?.entreprise || "Entreprise"),
            duree: cleanText(experience.duree || fallbackAdapted.adaptedExperiences[index]?.duree || "1 an"),
            missions: Array.isArray(experience.missions) && experience.missions.length
              ? experience.missions.map((mission) => cleanText(mission)).filter(Boolean)
              : fallbackAdapted.adaptedExperiences[index]?.missions || [],
          }))
        : fallbackAdapted.adaptedExperiences,
    score: analysis.score,
    niveau: analysis.niveau,
    couleur: analysis.couleur,
    fitSummary: cleanText(aiOutput.fitSummary || ""),
  };

  return {
    cvData: normalizedCv,
    offerInsights,
    analysis,
    adapted,
  };
}
