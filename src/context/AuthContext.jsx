import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'sobral_admin_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const login = (t) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
