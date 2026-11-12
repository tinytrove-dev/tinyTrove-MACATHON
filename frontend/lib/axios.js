import axios from "axios";

// Set EXPO_PUBLIC_MY_IP_ADDRESS in frontend/.env to your computer's LAN IP
// so a phone running Expo Go can reach the backend.
const host = process.env.EXPO_PUBLIC_MY_IP_ADDRESS || "localhost";
const baseURL = process.env.EXPO_PUBLIC_API_URL || `http://${host}:3000/api`;

export const axiosInstance = axios.create({ baseURL });

// --- SESSION ---
// Held in memory: signing in again is required after the app restarts.
let session = null;
let onSessionExpired = null;

export const setSession = (newSession) => {
  session = newSession;
};

export const clearSession = () => {
  session = null;
};

// Called when the session can't be refreshed, so the app can show Login
export const setOnSessionExpired = (callback) => {
  onSessionExpired = callback;
};

axiosInstance.interceptors.request.use((config) => {
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// On a 401, try one refresh, then replay the original request
let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.startsWith("/user-auth/sign-") || original?.url === "/user-auth/refresh";

    if (error.response?.status !== 401 || !session?.refresh_token || original._retried || isAuthRoute) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      refreshPromise ??= axios
        .post(`${baseURL}/user-auth/refresh`, { refresh_token: session.refresh_token })
        .finally(() => { refreshPromise = null; });

      const { data } = await refreshPromise;
      setSession(data.session);
      return axiosInstance(original);
    } catch (refreshError) {
      clearSession();
      onSessionExpired?.();
      return Promise.reject(error);
    }
  }
);
