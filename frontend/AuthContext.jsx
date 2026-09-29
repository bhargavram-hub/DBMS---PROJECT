import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("vbms_token");
    const storedUser = localStorage.getItem("vbms_user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      authApi
        .me()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("vbms_user", JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem("vbms_token");
          localStorage.removeItem("vbms_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { access_token, user: loggedInUser } = res.data;
    localStorage.setItem("vbms_token", access_token);
    localStorage.setItem("vbms_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (payload) => {
    await authApi.register(payload);
    return login(payload.email, payload.password);
  };

  const logout = () => {
    localStorage.removeItem("vbms_token");
    localStorage.removeItem("vbms_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
