import { useContext } from "react";
import { AuthContext, type AuthState } from "../context/AuthContextTypes";

export const useAuth = (): AuthState => useContext(AuthContext);
