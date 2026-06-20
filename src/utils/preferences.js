const USER_KEY = "user";

export const normalizeLanguage = (value, fallback = "fr") => {
  const language = String(value || "").trim().toLowerCase();

  if (language.startsWith("en")) {
    return "en";
  }

  if (language.startsWith("fr")) {
    return "fr";
  }

  return fallback === "en" ? "en" : "fr";
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return null;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const mergeStoredUser = (patch = {}) => {
  const current = getStoredUser() || {};
  const next = { ...current, ...patch };
  setStoredUser(next);
  return next;
};

export const getPreferredLanguage = (fallback = "fr") => {
  const storedUser = getStoredUser();
  if (storedUser?.langue) {
    return normalizeLanguage(storedUser.langue, fallback);
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLanguage(navigator.language, fallback);
  }

  return normalizeLanguage(fallback, fallback);
};

