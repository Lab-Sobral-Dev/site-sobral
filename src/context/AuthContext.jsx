import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const AUTH_FLAG = 'sobral_admin_auth';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_FLAG) === 'true'
  );

  const login = () => {
    localStorage.setItem(AUTH_FLAG, 'true');
    setIsAuthenticated(true);
  };

  const logout = async () => {
    localStorage.removeItem(AUTH_FLAG);
    setIsAuthenticated(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
