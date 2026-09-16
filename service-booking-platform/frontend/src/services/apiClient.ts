import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const staffToken = localStorage.getItem("staff_token");
  if (staffToken && config.headers) {
    if (typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${staffToken}`);
    } else {
      config.headers.Authorization = `Bearer ${staffToken}`;
    }
  }
  const adminKey = localStorage.getItem("admin_api_key");
  if (adminKey && config.headers) {
    if (typeof (config.headers as any).set === "function") {
      (config.headers as any).set("X-Admin-Key", adminKey);
    } else {
      config.headers["X-Admin-Key"] = adminKey;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || "An error occurred";
    console.error("[API Error]", message);
    return Promise.reject(error);
  }
);

export default apiClient;
