import axios, { type AxiosResponse } from "axios";
import { getAuthToken, removeAuthToken } from "./auth";

const API_BASE_URL = "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // Log all API errors for debugging
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
        timestamp: new Date().toISOString(),
      });
    } else if (error.request) {
      console.error("API Network Error:", {
        message: error.message,
        url: error.config?.url,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error("API Request Error:", {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.response?.status === 401) {
      removeAuthToken();
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default api;
