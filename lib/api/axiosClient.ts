/**
 * lib/api/axiosClient.ts
 *
 * Single shared Axios instance for all network requests across the application.
 *
 * Architectural Principles:
 * 1. Single Source of Truth: All API modules import this client; no other axios.create() is permitted.
 * 2. Request Interceptor: Automatically inspects authStorage and injects the Bearer JWT token into
 *    the Authorization header when available.
 * 3. Response Interceptor: Catches HTTP and network failures and normalizes them into a consistent
 *    `ApiError` interface ({ message, status, raw }). Crucially, toasts are NOT fired here to ensure
 *    calling components retain full autonomy over their specific UI error treatments.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/types";
import { getAuthToken } from "@/lib/utils/authStorage";

const BASE_URL = "https://dummyjson.com";

export const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15s timeout to prevent hanging connections
});

// Request Interceptor: Attaches Authorization Bearer token to outgoing calls
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Normalizes any API / Network error into standard ApiError format
axiosClient.interceptors.response.use(
  (response) => {
    // Transparently pass through successful responses
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    let normalizedError: ApiError;

    if (error.response) {
      // Server responded with non-2xx status code
      const serverMessage = error.response.data?.message;
      const status = error.response.status;

      normalizedError = {
        message: serverMessage || `Request failed with status code ${status}`,
        status,
        raw: error.response.data,
      };
    } else if (error.request) {
      // Network connectivity failure or timeout
      normalizedError = {
        message: "Unable to reach server. Please verify your internet connection.",
        status: 0,
        raw: error.request,
      };
    } else {
      // Client-side request setup error
      normalizedError = {
        message: error.message || "An unexpected error occurred.",
        raw: error,
      };
    }

    // Reject promise with normalized ApiError for caller to handle
    return Promise.reject(normalizedError);
  }
);

export default axiosClient;
