import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;
const TOKEN_KEY = 'csmip_token';
const REFRESH_TOKEN_KEY = 'csmip_refresh_token';
const USER_KEY = 'csmip_user';
const AuthContext = createContext({ user: null, token: null, login: () => {}, logout: () => {}, refresh: () => {} });

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    role: typeof user.role === 'string' ? user.role.toLowerCase() : user.role
  };
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try { return normalizeUser(JSON.parse(localStorage.getItem(USER_KEY) || "null")); } catch { return null; }
  });

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
      const nextUser = normalizeUser(res.data.user || res.data);
      setUser(nextUser);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch (e) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = (newToken, newUser) => {
    const normalizedUser = normalizeUser(newUser);
    setToken(newToken);
    setUser(normalizedUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return <AuthContext.Provider value={{ user, token, login, logout, refresh }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const authHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : {};
export const API_URL = API;
