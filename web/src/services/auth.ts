import api from "./api";
import {
  type UserCreate,
  type User,
  type Token,
  type UserUpdate,
} from "@schema/auth";

/**
 * LocalStorage key constant for storing the authentication token.
 * @constant
 */
export const TOKEN_KEY = "auth_token" as const;

/**
 * Safely reads the authentication token from localStorage.
 * Includes error handling for cases where localStorage is unavailable (e.g., SSR, private mode).
 *
 * @returns The stored auth token string, or null if not found or on error
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to read auth token from localStorage:", error);
    return null;
  }
}

/**
 * Safely stores the authentication token in localStorage.
 * Includes error handling for cases where localStorage is unavailable or quota is exceeded.
 *
 * @param token - The authentication token to store
 * @returns true if the token was successfully stored, false on error
 */
export function setAuthToken(token: string): boolean {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error("Failed to store auth token in localStorage:", error);
    return false;
  }
}

/**
 * Safely removes the authentication token from localStorage.
 * Includes error handling for cases where localStorage is unavailable.
 *
 * @returns true if the token was successfully removed (or didn't exist), false on error
 */
export function removeAuthToken(): boolean {
  try {
    localStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error("Failed to remove auth token from localStorage:", error);
    return false;
  }
}

/**
 * Authentication API methods for user login, registration, and profile management.
 */
export const authApi = {
  /**
   * Authenticates a user with email and password.
   * Uses form-data format as required by the OAuth2 password flow.
   *
   * @param email - User's email address (used as username)
   * @param password - User's password
   * @returns Promise resolving to the token response containing access_token and token_type
   */
  login: async (email: string, password: string): Promise<Token> => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/auth/token/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Registers a new user account.
   * After successful registration, automatically logs in the user to get an access token.
   *
   * @param userData - User registration data including email, name, and password
   * @returns Promise resolving to the token response for the newly created user
   */
  register: async (userData: UserCreate): Promise<Token> => {
    // First, register the user
    await api.post("/auth/register/", userData);
    // Then, login to get the access token
    return authApi.login(userData.email, userData.password);
  },

  /**
   * Retrieves the current authenticated user's profile.
   * Requires a valid authentication token in the request headers.
   *
   * @returns Promise resolving to the current user's profile data
   */
  getMe: async (): Promise<User> => {
    const response = await api.get("/auth/me/");
    return response.data;
  },

  /**
   * Updates the current authenticated user's profile.
   * Supports partial updates - only provided fields will be modified.
   *
   * @param userData - Partial user data to update (name, email, password)
   * @returns Promise resolving to the updated user profile
   */
  updateMe: async (userData: UserUpdate): Promise<User> => {
    const response = await api.patch("/auth/me/", userData);
    return response.data;
  },
};
