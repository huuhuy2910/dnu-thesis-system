import axios from "axios";

const api = axios.create({
  baseURL:
    (import.meta.env.VITE_API_BASE_URL || "http://localhost:5180") + "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true, // tạm thời comment để test CORS
});

export default api;
