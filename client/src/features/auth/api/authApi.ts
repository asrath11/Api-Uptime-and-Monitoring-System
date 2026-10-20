import axios, { type AxiosRequestConfig } from "axios";
import { z } from "zod";
import {
  type AuthUser,
  type LoginCredentials,
  type SignupCredentials,
  errorResponseSchema,
  authResponseSchema,
} from "./authApiSchema";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/+$/,
  "",
);
const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export class AuthApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

async function requestJson(
  path: string,
  config: AxiosRequestConfig = {},
): Promise<unknown> {
  try {
    const response = await authApi.request<unknown>({
      ...config,
      url: path,
    });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    if (!error.response) {
      throw new AuthApiError(
        "Unable to reach the server. Check your connection and try again.",
        0,
      );
    }

    const payload: unknown = error.response.data;
    const parsedError = errorResponseSchema.safeParse(payload);
    const message = parsedError.success
      ? (parsedError.data.errors?.[0]?.message ?? parsedError.data.message)
      : undefined;

    throw new AuthApiError(
      message || "The request could not be completed.",
      error.response.status,
    );
  }
}

function parseAuthResponse(payload: unknown): AuthUser {
  const result = authResponseSchema.safeParse(payload);
  if (!result.success) {
    throw new AuthApiError(
      "The server returned an unexpected authentication response.",
      502,
    );
  }
  return result.data.user;
}

export async function register(
  credentials: SignupCredentials,
): Promise<AuthUser> {
  const { name, email, password } = credentials;
  const payload = await requestJson("/auth/register", {
    method: "POST",
    data: { name, email, password },
  });
  return parseAuthResponse(payload);
}

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const payload = await requestJson("/auth/login", {
    method: "POST",
    data: credentials,
  });
  return parseAuthResponse(payload);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await requestJson("/auth/me");
    return parseAuthResponse(payload);
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  const payload = await requestJson("/auth/logout", { method: "POST" });
  const result = z.object({ success: z.literal(true) }).safeParse(payload);
  if (!result.success) {
    throw new AuthApiError(
      "The server returned an unexpected logout response.",
      502,
    );
  }
}
