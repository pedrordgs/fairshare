import axios, { type AxiosResponse } from "axios";
import { toast } from "sonner";
import { getAuthToken, removeAuthToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

      const status = error.response.status;

      // Show toast notifications for specific HTTP errors
      if (status === 400) {
        toast.error("Please check your information and try again.");
      } else if (status === 401) {
        // Skip 401 handling for login endpoint - let LoginForm handle wrong credentials
        if (error.config?.url === "/auth/token") {
          return Promise.reject(error);
        }
        toast.error("Your session has expired. Please sign in again.");
        removeAuthToken();
        window.location.href = "/";
      } else if (status === 403) {
        toast.error(
          "You don't have permission to do that. Check with the group owner if you need access.",
        );
      } else if (status === 404) {
        toast.error(
          "We couldn't find what you're looking for. It may have been deleted.",
        );
      } else if (status >= 500) {
        toast.error("Oops! Something went wrong on our end. Please try again.");
      }
    } else if (error.request) {
      console.error("API Network Error:", {
        message: error.message,
        url: error.config?.url,
        timestamp: new Date().toISOString(),
      });
      toast.error(
        "Connection issue - please check your internet and try again.",
      );
    } else {
      console.error("API Request Error:", {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return Promise.reject(error);
  },
);

export default api;
