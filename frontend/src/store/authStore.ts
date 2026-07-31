import { create } from "zustand";
import { configureAuthHandlers, setAccessToken } from "../services/apiClient.js";
import type { AuthSession, AuthUser } from "../types/auth.js";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  error: string | null;
  setSession: (session: AuthSession) => void;
  setUser: (user: AuthUser) => void;
  clearSession: (error?: string | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  error: null,
  setSession: (session) => {
    setAccessToken(session.accessToken);
    set({
      user: session.user,
      accessToken: session.accessToken,
      status: "authenticated",
      error: null
    });
  },
  setUser: (user) => {
    set({ user, status: "authenticated", error: null });
  },
  clearSession: (error = null) => {
    setAccessToken(null);
    set({
      user: null,
      accessToken: null,
      status: "unauthenticated",
      error
    });
  },
  setStatus: (status) => {
    set({ status });
  },
  setError: (error) => {
    set({ error });
  }
}));

configureAuthHandlers({
  onSessionRefreshed: (session) => {
    useAuthStore.getState().setSession(session);
  },
  onSessionExpired: () => {
    useAuthStore.getState().clearSession();
  }
});
