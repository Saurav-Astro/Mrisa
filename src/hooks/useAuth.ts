import { useEffect, useState } from "react";
import { ApiError, loadAdminSession, loginAdmin } from "@/lib/api";
import {
  AuthState,
  clearAdminSession,
  normalizeSessionUser,
  readAdminSession,
  storeAdminSession,
} from "@/lib/auth";

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const storedSession = readAdminSession();
      if (!storedSession) {
        setAuthState({ user: null, session: null, loading: false });
        return;
      }

      const session = await loadAdminSession();
      if (session) {
        storeAdminSession(session);
        setAuthState({
          user: normalizeSessionUser(session),
          session,
          loading: false,
        });
        return;
      }

      clearAdminSession();
      setAuthState({ user: null, session: null, loading: false });
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const session = await loginAdmin(email, password);
      storeAdminSession(session);
      setAuthState({
        user: normalizeSessionUser(session),
        session,
        loading: false,
      });
      return { error: null, data: session };
    } catch (error) {
      return { error: error instanceof ApiError ? error : new Error("Login failed"), data: null };
    }
  };

  const logout = async () => {
    clearAdminSession();
    setAuthState({ user: null, session: null, loading: false });
    return { error: null };
  };

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: authState.user !== null,
  };
};
