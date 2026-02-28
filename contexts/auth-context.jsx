"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = () => {
    globalThis.location.href = "/api/auth/adobe";
  };

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    globalThis.location.href = "/";
  };

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
