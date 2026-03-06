const ACCESS_TOKEN_KEY = "access_token";
const EXPIRES_AT_KEY = "access_token_expires_at";
const LOGIN_RESPONSE_KEY = "login_response";
const AUTH_SESSION_KEY = "auth_session";
const EXPIRED_MESSAGE_KEY = "auth_expired_message";
const APP_USER_KEY = "app_user";

let memoryAccessToken: string | null = null;
let memoryExpiresAt: string | null = null;

function getStorageList(): Storage[] {
  if (typeof window === "undefined") return [];
  return [window.localStorage, window.sessionStorage];
}

function readFromAnyStorage(key: string): string | null {
  for (const storage of getStorageList()) {
    const value = storage.getItem(key);
    if (value) return value;
  }
  return null;
}

function writeToStorageWithFallback(key: string, value: string): void {
  const storages = getStorageList();
  if (storages.length === 0) return;

  for (const storage of storages) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      // continue to fallback storage
    }
  }
}

function removeFromAllStorage(key: string): void {
  for (const storage of getStorageList()) {
    storage.removeItem(key);
  }
}

function parseExpireTime(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = Date.parse(expiresAt);
  if (Number.isNaN(ms)) return null;
  return ms;
}

function tryHydrateTokenFromLegacyPayload(): void {
  if (memoryAccessToken) return;

  const authSessionRaw = readFromAnyStorage(AUTH_SESSION_KEY);
  if (authSessionRaw) {
    try {
      const parsed = JSON.parse(authSessionRaw) as {
        accessToken?: string;
        expiresAt?: string;
      };
      if (parsed?.accessToken) {
        setAuthSession({
          accessToken: parsed.accessToken,
          expiresAt: parsed.expiresAt ?? null,
        });
        return;
      }
    } catch {
      // ignore malformed legacy payload
    }
  }

  const loginResponseRaw = readFromAnyStorage(LOGIN_RESPONSE_KEY);
  if (loginResponseRaw) {
    try {
      const parsed = JSON.parse(loginResponseRaw) as {
        accessToken?: string;
        expiresAt?: string;
      };
      if (parsed?.accessToken) {
        setAuthSession({
          accessToken: parsed.accessToken,
          expiresAt: parsed.expiresAt ?? null,
        });
      }
    } catch {
      // ignore malformed legacy payload
    }
  }
}

export function setAuthSession(input: {
  accessToken?: string | null;
  expiresAt?: string | null;
}): void {
  const token = input.accessToken?.trim() || null;
  const expiresAt = input.expiresAt?.trim() || null;

  memoryAccessToken = token;
  memoryExpiresAt = expiresAt;

  if (token) {
    writeToStorageWithFallback(ACCESS_TOKEN_KEY, token);
  } else {
    removeFromAllStorage(ACCESS_TOKEN_KEY);
  }

  if (expiresAt) {
    writeToStorageWithFallback(EXPIRES_AT_KEY, expiresAt);
  } else {
    removeFromAllStorage(EXPIRES_AT_KEY);
  }
}

export function getAccessToken(): string | null {
  if (!memoryAccessToken) {
    memoryAccessToken = readFromAnyStorage(ACCESS_TOKEN_KEY);
  }
  if (!memoryExpiresAt) {
    memoryExpiresAt = readFromAnyStorage(EXPIRES_AT_KEY);
  }

  if (!memoryAccessToken) {
    tryHydrateTokenFromLegacyPayload();
  }

  if (!memoryAccessToken) return null;

  const expired = isTokenExpired(memoryExpiresAt);
  if (expired) {
    clearAuthSession();
    return null;
  }

  return memoryAccessToken;
}

export function getTokenExpiresAt(): string | null {
  if (!memoryExpiresAt) {
    memoryExpiresAt = readFromAnyStorage(EXPIRES_AT_KEY);
  }
  return memoryExpiresAt;
}

export function isTokenExpired(
  expiresAt: string | null = getTokenExpiresAt(),
): boolean {
  const expiresAtMs = parseExpireTime(expiresAt);
  if (!expiresAtMs) return false;
  return Date.now() >= expiresAtMs;
}

export function hasValidAccessToken(): boolean {
  return !!getAccessToken();
}

export function markSessionExpiredMessage(
  message = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
): void {
  writeToStorageWithFallback(EXPIRED_MESSAGE_KEY, message);
}

export function consumeSessionExpiredMessage(): string | null {
  const message = readFromAnyStorage(EXPIRED_MESSAGE_KEY);
  if (!message) return null;
  removeFromAllStorage(EXPIRED_MESSAGE_KEY);
  return message;
}

export function clearAuthSession(): void {
  memoryAccessToken = null;
  memoryExpiresAt = null;

  const keys = [
    ACCESS_TOKEN_KEY,
    EXPIRES_AT_KEY,
    LOGIN_RESPONSE_KEY,
    AUTH_SESSION_KEY,
    APP_USER_KEY,
  ];

  keys.forEach((key) => removeFromAllStorage(key));
}

export const AuthSessionKeys = {
  ACCESS_TOKEN_KEY,
  EXPIRES_AT_KEY,
  LOGIN_RESPONSE_KEY,
  AUTH_SESSION_KEY,
  EXPIRED_MESSAGE_KEY,
  APP_USER_KEY,
};
