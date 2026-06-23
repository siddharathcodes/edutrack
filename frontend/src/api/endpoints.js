import api from "./client";

export const ApplicationsAPI = {
  list: (params) => api.get("/applications", { params }).then((r) => r.data),
  get: (id) => api.get(`/applications/${id}`).then((r) => r.data),
  create: (data) => api.post("/applications", data).then((r) => r.data),
  update: (id, data) => api.put(`/applications/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/applications/${id}`).then((r) => r.data),
  bulkUpdateStage: (ids, stage) => api.post("/applications/bulk/stage", { ids, stage }).then((r) => r.data),
  bulkDelete: (ids) => api.post("/applications/bulk/delete", { ids }).then((r) => r.data),
  dashboardStats: (params) => api.get("/applications/stats/dashboard", { params }).then((r) => r.data),
};

export const UsersAPI = {
  list: () => api.get("/users").then((r) => r.data),
  create: (data) => api.post("/users", data).then((r) => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const CountriesAPI = {
  list: () => api.get("/countries").then((r) => r.data),
  create: (data) => api.post("/countries", data).then((r) => r.data),
  update: (id, data) => api.put(`/countries/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/countries/${id}`).then((r) => r.data),
};

export const NotificationsAPI = {
  list: () => api.get("/notifications").then((r) => r.data),
  create: (data) => api.post("/notifications", data).then((r) => r.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post("/notifications/read-all").then((r) => r.data),
  remove: (id) => api.delete(`/notifications/${id}`).then((r) => r.data),
  generateAutoAlerts: (staleDays) => api.post("/notifications/generate-auto-alerts", { staleDays }).then((r) => r.data),
};

export const DailyReportsAPI = {
  getToday: () => api.get("/daily-reports/today").then((r) => r.data),
  updateToday: (text) => api.put("/daily-reports/today", { text }).then((r) => r.data),
  addTodo: (text) => api.post("/daily-reports/today/todos", { text }).then((r) => r.data),
  toggleTodo: (todoId) => api.post(`/daily-reports/today/todos/${todoId}/toggle`).then((r) => r.data),
  deleteTodo: (todoId) => api.delete(`/daily-reports/today/todos/${todoId}`).then((r) => r.data),
  adminList: (params) => api.get("/daily-reports/admin", { params }).then((r) => r.data),
};

export const AnalysisAPI = {
  generate: (params) => api.get("/analysis", { params }).then((r) => r.data),
};

export const AuthAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};
