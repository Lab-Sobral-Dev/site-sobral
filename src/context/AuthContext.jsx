import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);
const AUTH_FLAG     = 'sobral_admin_auth';
const AUTH_USER_KEY = 'sobral_admin_user';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_FLAG) === 'true'
  );
  const [user, setUserState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch { return null; }
  });
  // Vencimento da sessão em ms. Vem do /api/auth/me e do /api/auth/refresh —
  // é o que permite avisar antes de o token morrer no meio de uma edição.
  const [expiresAt, setExpiresAt] = useState(null);

  const login = useCallback((userData) => {
    localStorage.setItem(AUTH_FLAG, 'true');
    if (userData) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      setUserState(userData);
    }
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(AUTH_FLAG);
    localStorage.removeItem(AUTH_USER_KEY);
    setIsAuthenticated(false);
    setUserState(null);
    setExpiresAt(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
  }, []);

  const renovarSessao = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      setExpiresAt(data.expiresAt ?? null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const setUser = useCallback((userData) => {
    setUserState(prev => {
      if (prev?.email === userData?.email) return prev;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      return userData;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, login, logout, user, setUser,
      expiresAt, setExpiresAt, renovarSessao,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
