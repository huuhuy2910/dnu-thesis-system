import { createContext } from "react";
import type { User } from "../types/user";

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User | null) => void;
  logout: () => void;
};

const defaultState: AuthState = {
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthState>(defaultState);
