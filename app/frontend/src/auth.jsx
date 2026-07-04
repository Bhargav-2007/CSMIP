import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.origin.includes('vercel.app') ? `${window.location.origin}/api` : 'http://localhost:5000')}`;
const AuthContext = createContext({ user: null, token: null, login: () => {}, logout: () => {}, refresh: () => {} });

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("csmip_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("csmip_user") || "null"); } catch { return null; }
  });

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
      setUser(res.data);
      localStorage.setItem("csmip_user", JSON.stringify(res.data));
    } catch (e) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("csmip_token", newToken);
    localStorage.setItem("csmip_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem("csmip_token");
    localStorage.removeItem("csmip_user");
  };

  return <AuthContext.Provider value={{ user, token, login, logout, refresh }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const authHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : {};
export const API_URL = API;
