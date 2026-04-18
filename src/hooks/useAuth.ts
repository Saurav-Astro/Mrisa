import { useEffect, useState } from "react";
import { ApiError, loginAdmin } from "@/lib/api";
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
    const initializeAuth = () => {
      // Read session directly from localStorage — our JWT is self-validating.
      // No need for a server round-trip; the token expiry is encoded in the token itself.
      const storedSession = readAdminSession();
      if (storedSession) {
        setAuthState({
          user: normalizeSessionUser(storedSession),
          session: storedSession,
          loading: false,
        });
      } else {
        setAuthState({ user: null, session: null, loading: false });
      }
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