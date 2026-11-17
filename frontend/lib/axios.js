import axios from "axios";

// The signed-in user's Supabase access token. Sent with every request so the backend knows who is calling.
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const axiosInstance = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api",
});

axiosInstance.interceptors.request.use((config) => {
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}
	return config;
});
