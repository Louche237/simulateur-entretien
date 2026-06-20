import { getPreferredLanguage, normalizeLanguage } from "./preferences";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const resolveLanguage = (langue) =>
  normalizeLanguage(langue || getPreferredLanguage());

const request = async (path, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        offline: false,
        message: data.message || "Une erreur est survenue",
        ...data,
      };
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === "AbortError";
    return {
      success: false,
      offline: !isTimeout,
      timeout: isTimeout,
      message: isTimeout
        ? "La requête a pris trop de temps. Veuillez réessayer."
        : "Backend indisponible pour le moment",
    };
  }
};

const requestMultipart = async (path, options = {}, timeoutMs = 60000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        offline: false,
        message: data.message || "Une erreur est survenue",
        ...data,
      };
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === "AbortError";
    return {
      success: false,
      offline: !isTimeout,
      timeout: isTimeout,
      message: isTimeout
        ? "L'analyse a pris trop de temps. Veuillez réessayer."
        : "Backend indisponible pour le moment",
    };
  }
};


// ── AUTH ─────────────────────────────────────────────────────
export const authAPI = {
  connexion: (data) =>
    request("/auth/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  inscription: (data) =>
    request("/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};

// ── USER ─────────────────────────────────────────────────────
export const userAPI = {
  getProfil: () =>
    request("/users/profil", { headers: headers() }),

  modifierProfil: (data) =>
    request("/users/profil", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(data),
    }),

  modifierMotDePasse: (data) =>
    request("/users/password", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(data),
    }),

  getStats: () =>
    request("/users/stats", { headers: headers() }),

  supprimerCompte: () =>
    request("/users/compte", {
      method: "DELETE",
      headers: headers(),
    }),
};

// ── SESSIONS ─────────────────────────────────────────────────
export const sessionAPI = {
  creer: (data) =>
    request("/sessions", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    }),

  getToutes: (params = "") =>
    request(`/sessions${params}`, { headers: headers() }),

  getUne: (id) =>
    request(`/sessions/${id}`, { headers: headers() }),

  soumettreReponse: (id, data) =>
    request(`/sessions/${id}/reponse`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    }),

  terminer: (id, data) =>
    request(`/sessions/${id}/terminer`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(data),
    }),

  supprimer: (id) =>
    request(`/sessions/${id}`, {
      method: "DELETE",
      headers: headers(),
    }),
};

// ── SIMULATION ───────────────────────────────────────────────
export const simulationAPI = {
  getQuestions: (params = "") =>
    request(`/simulation/questions${params}`, { headers: headers() }),

  seedQuestions: () =>
    request("/simulation/seed", { method: "POST" }),
};

// ── CV ───────────────────────────────────────────────────────
export const cvAPI = {
  extraire: (file, { langue } = {}) => {
    if (!file) {
      return Promise.resolve({
        success: false,
        message: "Aucun fichier fourni",
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    if (langue) {
      formData.append("langue", resolveLanguage(langue));
    }

    return requestMultipart("/cv/extract", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
  },

  analyser: ({ cvData, offer, langue = "fr" } = {}) =>
    request("/cv/analyze", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        cvData,
        offer,
        langue: resolveLanguage(langue),
      }),
    }),

  analyserFichier: (file, offer, { langue = "fr" } = {}) => {
    if (!file) {
      return Promise.resolve({
        success: false,
        message: "Aucun fichier fourni",
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("offer", offer || "");
    formData.append("langue", resolveLanguage(langue));

    return requestMultipart("/cv/analyze-file", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
  },
};
