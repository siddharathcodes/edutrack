import { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("edutrack_token");
    if (!token) {
      setLoading(false);
      return;
    }
    AuthAPI.me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem("edutrack_token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token, user } = await AuthAPI.login(email, password);
    localStorage.setItem("edutrack_token", token);
    localStorage.setItem("edutrack_user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem("edutrack_token");
    localStorage.removeItem("edutrack_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
