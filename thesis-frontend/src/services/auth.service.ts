import { fetchData } from "../api/fetchData";
import type { ApiResponse } from "../types/api";
import type { User } from "../types/user";
import { normalizeRole } from "../utils/role";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResult {
  user?: User | null;
  raw?: unknown; // raw data from API.data
}

export interface ResetPasswordRequest {
  userCode: string;
  newPassword: string;
}

export interface ResetPasswordResult {
  userCode: string;
  message: string;
}

function extractUserFromApiData(data: unknown): User | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  // common shapes: { user: { ... } } or { User: { ... } }
  if (obj.user && typeof obj.user === "object") return obj.user as User;
  if (obj.User && typeof obj.User === "object") return obj.User as User;

  // Sometimes API returns the user fields directly
  const hasUserLikeFields = [
    "role",
    "username",
    "userID",
    "userCode",
    "fullName",
  ].some((k) => k in obj);
  if (hasUserLikeFields) return obj as User;

  return null;
}

export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<unknown>> {
  return await fetchData<ApiResponse<unknown>>("/Auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function parseLoginResponse(resp: ApiResponse<unknown>): LoginResult {
  const raw = resp as unknown;

  // Try several candidate locations for the user info
  const candidates: unknown[] = [];
  // 1. resp.data (common ApiResponse shape)
  // 2. resp.data.data (some APIs wrap again)
  // 3. resp itself (some backends return user fields at root)
  try {
    const anyResp = resp as unknown as { data?: unknown };
    candidates.push(anyResp.data ?? null);
    const nested = anyResp.data as unknown as { data?: unknown } | undefined;
    candidates.push(nested?.data ?? null);
  } catch {
    /* ignore */
  }
  candidates.push(resp as unknown);

  let user: User | null = null;
  for (const c of candidates) {
    user = extractUserFromApiData(c);
    if (user) break;
  }

  // Normalize role to canonical uppercase values used by routing
  if (user && user.role) {
    try {
      user.role = normalizeRole(user.role) as unknown as User["role"];
    } catch {
      /* noop */
    }
  }

  return { user, raw };
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ApiResponse<ResetPasswordResult>> {
  return await fetchData<ApiResponse<ResetPasswordResult>>(
    "/Auth/reset-password",
    {
      method: "POST",
      body: payload,
    },
  );
}
