import axios from "axios";

// Empty means the backend is on the same site (e.g. Vercel serving /api).
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("isla_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
