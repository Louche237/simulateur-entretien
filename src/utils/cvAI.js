import { cvAPI } from "./api";
import { generateAdaptedCV, getOfferInsights } from "./cvLocal";

/**
 * Analyse a CV with optional job offer description.
 * @param {Object} cvData - The CV data object (experience, education, etc.)
 * @param {string} offer - Job offer text to tailor the CV.
 * @returns {Promise<Object>} - Result from the backend analysis endpoint or local fallback.
 */
export async function analyseCV(cvData, offer) {
  // Try API first
  const response = await cvAPI.analyser({ cvData, offer });

  if (response.success && response.adapted) {
    return response;
  }

  // Fallback to local
  return {
    success: true,
    adapted: generateAdaptedCV(cvData, offer),
    offerInsights: getOfferInsights(offer),
  };
}

export default { analyseCV };
