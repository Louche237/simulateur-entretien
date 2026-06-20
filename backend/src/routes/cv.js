import express from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  analyzeCvProfile,
  extractCvDataFromUpload,
  getOfferInsights,
} from "../services/cv.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.use(requireAuth);

const resolveLanguage = (value) => (String(value || "fr").trim().toLowerCase() === "en" ? "en" : "fr");

const analyzeSchema = z.object({
  cvData: z.any().optional(),
  offer: z.string().trim().min(20, "L'offre est trop courte"),
  langue: z.enum(["fr", "en"]).optional().default("fr"),
});

router.post("/extract", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Aucun fichier reçu",
    });
  }

  const cvData = await extractCvDataFromUpload(req.file, {
    langue: resolveLanguage(req.body?.langue),
  });
  return res.json({
    success: true,
    cvData,
  });
});

router.post("/analyze-file", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Aucun fichier reçu",
    });
  }

  const offer = String(req.body.offer || "").trim();
  if (offer.length < 20) {
    return res.status(400).json({
      success: false,
      message: "L'offre est trop courte",
    });
  }

  const cvData = await extractCvDataFromUpload(req.file, {
    langue: resolveLanguage(req.body?.langue),
  });
  const result = await analyzeCvProfile({
    cvData,
    offer,
    langue: resolveLanguage(req.body?.langue),
  });

  return res.json({
    success: true,
    cvData: result.cvData,
    offerInsights: result.offerInsights || getOfferInsights(offer),
    analysis: result.analysis,
    adapted: result.adapted,
  });
});

router.post("/analyze", async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path[0] || "general",
        msg: issue.message,
      })),
    });
  }

  const result = await analyzeCvProfile({
    cvData: parsed.data.cvData,
    offer: parsed.data.offer,
    langue: parsed.data.langue || "fr",
  });

  return res.json({
    success: true,
    cvData: result.cvData,
    offerInsights: result.offerInsights || getOfferInsights(parsed.data.offer),
    analysis: result.analysis,
    adapted: result.adapted,
  });
});



export default router;
