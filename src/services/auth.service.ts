import api from "../api/axios";
import type { ApiResponse } from "../types/api";
import type { User } from "../types/user";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResult {
  user?: User | null;
  raw?: unknown; // raw data from API.data
}

function extractUserFromApiData(data: unknown): User | null {
  if (!data) return null;
  // attempt common shapes:
  if (typeof data === "object") {
    if ("user" in data && data.user) return data.user;
    if ("User" in data && data.User) return data.User;
    // maybe API returns directly user fields
    if ("role" in data || "Role" in data || "username" in data)
      return data as User;
  }
  return null;
}

export async function login(
  credentials: LoginRequest
): Promise<ApiResponse<unknown>> {
  const resp = await api.post<ApiResponse<unknown>>("/Auth/login", credentials);
  return resp.data;
}

export function parseLoginResponse(resp: ApiResponse<unknown>): LoginResult {
  const data = resp.data ?? null;
  const user = extractUserFromApiData(data);
  return { user, raw: data };
}
