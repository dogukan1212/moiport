import axios from "axios";

const resolveBase = () => {
  if (typeof window !== "undefined") {
    // Önce .env'deki API URL'ine bak (Örn: /api)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    const host = window.location.host || "";
    const hostname = window.location.hostname || "";
    
    // Yerel geliştirme ortamları için
    if (
      hostname === "localhost" || 
      hostname === "127.0.0.1" || 
      hostname.startsWith("192.168.") || 
      hostname.endsWith(".local")
    ) {
      return `http://${hostname}:3001`;
    }
  }
  
  const envUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_URL
      ? process.env.NEXT_PUBLIC_SOCKET_URL
      : null;
      
  return envUrl || "https://api.kolayentegrasyon.com";
};

export const SOCKET_URL = resolveBase();

export const getBaseURL = () => SOCKET_URL;

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
        const requestUrl = String(error?.config?.url || "");
        const isAuthRequest =
          requestUrl.startsWith("/auth") || requestUrl.includes("/auth/");
        const token = localStorage.getItem("token");

        if (error.response?.status === 401 && token && !isAuthRequest) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        } else if (error.response?.status === 403) {
            // Askıya alınma durumu (Forbidden)
            const msg = error.response?.data?.message || '';
            const isRestricted = 
                msg.includes('askıya alınmıştır') || msg.includes('suspended') ||
                msg.includes('Deneme süreniz sona ermiştir') || msg.includes('TRIAL_ENDED') ||
                msg.includes('Abonelik süreniz dolmuştur') || msg.includes('EXPIRED');

            if (isRestricted) {
                if (!window.location.pathname.startsWith('/dashboard/subscriptions')) {
                    window.location.href = "/dashboard/subscriptions";
                }
            }
        }
    }
    return Promise.reject(error);
  }
);

export default api;
