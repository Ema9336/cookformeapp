"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi, usersApi } from "../lib/api";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Access token lives ONLY in React memory — never written to localStorage or cookies
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyTokens = useCallback(async (at: string) => {
    setAccessToken(at);
    const me = await usersApi.me(at);
    setUser(me);
  }, []);

  // On mount: silently try to restore session via the httpOnly refresh-token cookie.
  // If the cookie exists the server will return a fresh access token.
  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const { accessToken: at } = await authApi.refresh();
        await applyTokens(at);
      } catch {
        // No valid session — that's fine, user is just logged out
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void restore();
    return () => { mounted = false; };
  }, [applyTokens]);

  const login = async (email: string, password: string) => {
    const { accessToken: at } = await authApi.login({ email, password });
    await applyTokens(at);
    // refresh token is set as httpOnly cookie by the server — nothing to do here
  };

  const register = async (email: string, name: string, password: string) => {
    const { accessToken: at } = await authApi.register({ email, name, password });
    await applyTokens(at);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    // Server clears the httpOnly cookie; we clear memory
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
