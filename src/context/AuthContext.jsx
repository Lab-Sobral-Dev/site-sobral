import { createContext, useContext, useState } from 'react';

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

  const login = (userData) => {
    localStorage.setItem(AUTH_FLAG, 'true');
    if (userData) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      setUserState(userData);
    }
    setIsAuthenticated(true);
  };

  const logout = async () => {
    localStorage.removeItem(AUTH_FLAG);
    localStorage.removeItem(AUTH_USER_KEY);
    setIsAuthenticated(false);
    setUserState(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
  };

  const setUser = (userData) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    setUserState(userData);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
