"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  authProvider: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authProvider, setAuthProvider] = useState(null);
  const [signInUrl, setSignInUrl] = useState("/api/auth/adobe");
  const [logoutUrl, setLogoutUrl] = useState("/api/auth/signout");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user ?? null);
        setAuthProvider(data.authProvider ?? null);
        if (data.signInUrl) setSignInUrl(data.signInUrl);
        if (data.logoutUrl) setLogoutUrl(data.logoutUrl);
      })
      .catch(() => {
        setUser(null);
        setAuthProvider(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = () => {
    globalThis.location.href = signInUrl;
  };

  const signOut = async () => {
    setUser(null);
    setAuthProvider(null);
    if (authProvider === "entra" && logoutUrl) {
      globalThis.location.href = logoutUrl;
    } else {
      await fetch("/api/auth/signout", { method: "POST" });
      globalThis.location.href = "/";
    }
  };

  const value = useMemo(
    () => ({ user, loading, authProvider, signIn, signOut }),
    [user, loading, authProvider, signInUrl, logoutUrl]
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
