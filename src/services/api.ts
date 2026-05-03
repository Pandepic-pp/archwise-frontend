import axios from 'axios';

const api = axios.create({
  //baseURL:  'https://archwise-backend.onrender.com/api',
  baseURL:  '/api',
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hld_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hld_token');
      localStorage.removeItem('hld_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  guest: () => api.post('/auth/guest'),
  me: () => api.get('/auth/me'),
};

// ─── Questions ────────────────────────────────────────────────────────────────
export const questionApi = {
  list: () => api.get('/questions'),
  get: (id: string) => api.get(`/questions/${id}`),
  random: () => api.get('/questions/random'),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessionApi = {
  create: (questionId: string) => api.post('/sessions', { questionId }),
  get: (id: string) => api.get(`/sessions/${id}`),
  list: () => api.get('/sessions'),
  start: (id: string) => api.patch(`/sessions/${id}/start`),
  startFinalAnswer: (id: string) => api.patch(`/sessions/${id}/final-answer`),

  submitAudio: (data: {
    audio: Blob;
    sessionId: string;
    interactionType: string;
    socketRoomId: string;
    diagramJson?: string;
    diagramImageBase64?: string;
  }) => {
    const formData = new FormData();
    formData.append('audio', data.audio, 'recording.webm');
    formData.append('sessionId', data.sessionId);
    formData.append('interactionType', data.interactionType);
    formData.append('socketRoomId', data.socketRoomId);
    if (data.diagramJson) formData.append('diagramJson', data.diagramJson);
    if (data.diagramImageBase64) formData.append('diagramImageBase64', data.diagramImageBase64);
    return api.post('/sessions/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },

  updateCurrentDiagram: (id: string, sceneJson: string) =>
    api.patch(`/sessions/${id}/diagram`, { sceneJson }),

  saveDiagram: (data: {
    sessionId: string;
    sceneJson: string;
    imageBase64?: string;
    label?: string;
  }) => api.post('/sessions/diagram', data),

  requestFollowUps: (data: { sessionId: string; socketRoomId: string }) =>
    api.post('/sessions/follow-ups', data),

  triggerEvaluation: (data: { sessionId: string; socketRoomId: string }) =>
    api.post('/sessions/evaluate', data),

  getWhiteboard: (id: string) =>
    api.get(`/sessions/${id}/whiteboard`),

  updateWhiteboard: (id: string, sceneJson: string) =>
    api.put(`/sessions/${id}/whiteboard`, { sceneJson }),

  discussDiagram: (data: {
    sessionId: string;
    socketRoomId: string;
    sceneJson: string;
    diagramTextDescription: string;
    diagramImageBase64?: string;
  }) => api.post('/sessions/discuss-diagram', data),
};

export default api;
