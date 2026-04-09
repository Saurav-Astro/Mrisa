import { RateLimiter, validateEmail } from "@/lib/security";

const SESSION_KEY = "mrisa-admin-session";

export interface StoredAdminSession {
  email: string;
  created_at: string;
  token: string;
  expires_at: string;
}

export interface AdminUser {
  email: string;
  created_at: string;
}

export interface AuthState {
  user: AdminUser | null;
  session: StoredAdminSession | null;
  loading: boolean;
}

export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000);
export const apiRateLimiter = new RateLimiter(100, 60 * 1000);

export const isBrowser = () => typeof window !== "undefined";

export const readAdminSession = (): StoredAdminSession | null => {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as StoredAdminSession;
    if (Date.now() > new Date(session.expires_at).getTime()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const storeAdminSession = (session: StoredAdminSession | null) => {
  if (!isBrowser()) return;

  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearAdminSession = () => {
  storeAdminSession(null);
};

export const normalizeSessionUser = (session: StoredAdminSession | null): AdminUser | null => {
  if (!session) return null;
  return {
    email: session.email,
    created_at: session.created_at,
  };
};

export { validateEmail };
