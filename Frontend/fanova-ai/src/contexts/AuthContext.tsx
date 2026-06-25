"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  refreshAuthToken,
} from "@/lib/api/auth";
import type { UserProfile } from "@/lib/api/auth";

const TOKEN_KEY = "nan_access_token";
const REFRESH_KEY = "nan_refresh_token";

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ roles: string[] }>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // Also clear the admin compatibility bridge token so the admin shell
    // does not stay open after a public logout.
    sessionStorage.removeItem("nan_admin_token");
    setUser(null);
  }, []);

  const hydrateUser = useCallback(async (token: string) => {
    const profile = await getMe(token);
    setUser(profile);
  }, []);

  // On mount: restore session from localStorage
  useEffect(() => {
    async function init() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        await hydrateUser(token);
      } catch {
        const refreshTk = localStorage.getItem(REFRESH_KEY);
        if (refreshTk) {
          try {
            const authData = await refreshAuthToken(refreshTk);
            localStorage.setItem(TOKEN_KEY, authData.accessToken);
            localStorage.setItem(REFRESH_KEY, authData.refreshToken);
            await hydrateUser(authData.accessToken);
          } catch {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [hydrateUser, clearAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const authData = await apiLogin(email, password);
      localStorage.setItem(TOKEN_KEY, authData.accessToken);
      localStorage.setItem(REFRESH_KEY, authData.refreshToken);
      await hydrateUser(authData.accessToken);
      // Return roles from the login response so callers can make routing
      // decisions without waiting for a React state-update cycle.
      return { roles: authData.roles };
    },
    [hydrateUser],
  );

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      // Call API only — do NOT store tokens or set user state.
      // The caller must redirect to /auth/login so the user logs in explicitly.
      await apiRegister(email, password, fullName);
    },
    [],
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) await hydrateUser(token);
  }, [hydrateUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
