import axios from "axios";

const envBase = (import.meta.env.VITE_API_BASE_URL || "http://192.168.0.102:5180/").toString();
const normalized = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
const api = axios.create({
  baseURL: normalized + "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true, // tạm thời comment để test CORS
});

export default api;