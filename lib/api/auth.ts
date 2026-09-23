/**
 * lib/api/auth.ts
 *
 * Authentication API module handling network calls for user login and session profile retrieval.
 *
 * Architectural Principles:
 * 1. Uses the single shared `axiosClient` instance for all requests.
 * 2. Fully typed inputs and outputs via plain `LoginCredentials` and `User` models.
 * 3. Does not manipulate UI or throw unhandled errors; leaves display & storage decisions to callers.
 */

import { axiosClient } from "./axiosClient";
import { LoginCredentials, User } from "@/types";

/**
 * Authenticates a user against the DummyJSON POST /auth/login endpoint.
 *
 * @param credentials - Object containing username and password
 * @returns Promise resolving to the authenticated User profile containing access token
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await axiosClient.post<User>("/auth/login", {
    username: credentials.username.trim(),
    password: credentials.password,
    expiresInMins: credentials.expiresInMins ?? 60,
  });

  return response.data;
}

/**
 * Retrieves the profile of the currently authenticated user from DummyJSON GET /auth/me.
 * Used for session verification on initial dashboard boot.
 *
 * @returns Promise resolving to the User profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await axiosClient.get<User>("/auth/me");
  return response.data;
}
