import React, { useEffect, useState } from "react";
import type { User } from "../types/user";
import { AuthContext } from "./AuthContextTypes";
import {
  clearAuthSession,
  hasValidAccessToken,
} from "../services/auth-session.service";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("app_user");
    return raw ? (JSON.parse(raw) as User) : null;
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
