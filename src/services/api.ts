import axios from 'axios';

const api = axios.create({
  //baseURL:  'https://archwise-backend.onrender.com/api',
  //baseURL:  '/api',
  baseURL: 'http://localhost:5000/api',
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
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  registerVerify: (data: { email: string; otp: string }) =>
    api.post('/auth/register/verify', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  guest: () => api.post('/auth/guest'),
  me: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// ─── Questions ────────────────────────────────────────────────────────────────
export const questionApi = {
  list: () => api.get('/questions'),
  get: (id: string) => api.get(`/questions/${id}`),
  random: () => api.get('/questions/random'),
  updatePractice: (
    id: string,
    data: { notes?: string; isDone?: boolean; reviewLater?: boolean }
  ) => api.patch(`/questions/${id}/practice`, data),
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
  }) => {
    const formData = new FormData();
    formData.append('audio', data.audio, 'recording.webm');
    formData.append('sessionId', data.sessionId);
    formData.append('interactionType', data.interactionType);
    formData.append('socketRoomId', data.socketRoomId);
    if (data.diagramJson) formData.append('diagramJson', data.diagramJson);
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

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: () => api.get('/admin/users'),
  userDetail: (userId: string) => api.get(`/admin/users/${userId}`),
};

export default api;
