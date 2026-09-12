import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = __DEV__ 
  ? 'http://10.35.152.84:3001/api' 
  : 'https://votre-backend.onrender.com/api';

export const setApiUrl = (url) => {
  global.__API_URL__ = url;
};

const getBaseUrl = () => global.__API_URL__ || API_URL;

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (e) {
    console.error('Erreur stockage token:', e);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (e) {
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (e) {
    console.error(e);
  }
};

export const storeUser = async (user) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (e) {
    console.error(e);
  }
};

export const getUser = async () => {
  try {
    const json = await AsyncStorage.getItem('user');
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem('user');
  } catch (e) {
    console.error(e);
  }
};

const request = async (path, options = {}) => {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${getBaseUrl()}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') 
      ? await response.json() 
      : await response.text();
    if (!response.ok) {
      const message = data?.error || data?.message || `Erreur ${response.status}`;
      throw new Error(message);
    }
    return data;
  } catch (err) {
    throw err;
  }
};

const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  warmup: () => fetch(`${getBaseUrl()}/health`).then(r => r.ok).catch(() => false),
};

const userAPI = {
  updateProfile: (body) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  updatePassword: (body) => request('/users/password', { method: 'PUT', body: JSON.stringify(body) }),
  getStats: () => request('/users/stats'),
};

const sessionsAPI = {
  getAll: () => request('/sessions'),
  get: (id) => request(`/sessions/${id}`),
  create: (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  finish: (id, body) => request(`/sessions/${id}/finish`, { method: 'POST', body: JSON.stringify(body) }),
};

const cvAPI = {
  extractFromText: (text, fileName) => request('/cv/extract-from-text', {
    method: 'POST',
    body: JSON.stringify({ text, fileName }),
  }),
  analyze: (cv, offer, lang) => request('/cv/analyze', {
    method: 'POST',
    body: JSON.stringify({ cv, offer, lang }),
  }),
  offerInsights: (offer) => request('/cv/offer-insights', {
    method: 'POST',
    body: JSON.stringify({ offer }),
  }),
  adaptCV: (cv, offer, lang) => request('/cv/adapt', {
    method: 'POST',
    body: JSON.stringify({ cv, offer, lang }),
  }),
};

const simulationAPI = {
  generateInterviewPlan: (params) => request('/simulation/generate-interview-plan', {
    method: 'POST', body: JSON.stringify(params),
  }),
  generateNextQuestion: (params) => request('/simulation/next-question', {
    method: 'POST', body: JSON.stringify(params),
  }),
  evaluateAnswer: (params) => request('/simulation/evaluate-answer', {
    method: 'POST', body: JSON.stringify(params),
  }),
  finalizeInterview: (params) => request('/simulation/finalize', {
    method: 'POST', body: JSON.stringify(params),
  }),
};

const adminAPI = {
  getStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
};

export const api = {
  auth: authAPI,
  user: userAPI,
  sessions: sessionsAPI,
  cv: cvAPI,
  simulation: simulationAPI,
  admin: adminAPI,
};
