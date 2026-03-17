import React, { useEffect, useState } from "react";
import type { User } from "../types/user";
import { AuthContext } from "./AuthContextTypes";
import {
  clearAuthSession,
  getRoleClaimFromAccessToken,
  hasValidAccessToken,
} from "../services/auth-session.service";
import { normalizeRole } from "../utils/role";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("app_user");
    const hydrated = raw ? (JSON.parse(raw) as User) : null;
    if (!hydrated) return null;

    const roleFromToken = normalizeRole(getRoleClaimFromAccessToken());
    const mergedRole = roleFromToken || normalizeRole(hydrated.role);
    return {
      ...hydrated,
      role: mergedRole || hydrated.role,
    };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("app_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("app_user");
    }
  }, [user]);

  useEffect(() => {
    if (!hasValidAccessToken() && user) {
      setUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const roleFromToken = normalizeRole(getRoleClaimFromAccessToken());
    if (!roleFromToken || roleFromToken === normalizeRole(user.role)) return;
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        role: roleFromToken,
      };
    });
  }, [user]);

  const login = (u: User | null) => setUser(u);
  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && hasValidAccessToken(),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
