import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, tokenStore, ApiError } from "./api";

export type User = {
  id: string;
  name?: string;
  email: string;
};

type AuthResponse = { token: string; user: User };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: User } | User>("/auth/me")
      .then((res) => {
        const u = (res as { user?: User }).user ?? (res as User);
        setUser(u);
      })
      .catch((e: ApiError) => {
        if (e.status === 401) tokenStore.clear();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false });
    tokenStore.set(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/auth/register", { method: "POST", body: { name, email, password }, auth: false });
    tokenStore.set(res.token);
    setUser(res.user);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}