"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isCookieAuth } from "@/lib/auth/cookie-auth";
import { getAdobeClientId } from "@/lib/auth/config";

const IMS_AUTHORIZE_URL = "https://ims-na1.adobelogin.com/ims/authorize/v2";
const SCOPE = "AdobeID,openid,read_organizations,additional_info.projectedProductContext";
const FIVE_MIN_MS = 5 * 60 * 1000;

function isImsImplicitConfigured() {
  return !!getAdobeClientId();
}

function parseTokenFromParams(params) {
  return {
    accessToken: params.get("access_token"),
    expiresIn: params.get("expires_in"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
  };
}

function getCleanRedirectTarget() {
  try {
    const stored = sessionStorage.getItem("postSignInRedirect");
    sessionStorage.removeItem("postSignInRedirect");
    if (stored) {
      const u = new URL(stored);
      u.hash = "";
      u.search = "";
      return u.toString();
    }
  } catch {
    // ignore
  }
  return `${typeof window !== "undefined" ? window.location.origin : ""}${typeof window !== "undefined" ? window.location.pathname || "/" : "/"}`;
}

const AuthContext = createContext({
  user: null,
  loading: true,
  authenticated: false,
  authProvider: null,
  accessToken: null,
  signIn: () => {},
  signOut: () => {},
  handleImsAuthenticated: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authProvider, setAuthProvider] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [signInUrl, setSignInUrl] = useState("/api/auth/adobe");
  const [logoutUrl, setLogoutUrl] = useState("/api/auth/signout");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Defer cookieAuth until after mount to avoid hydration mismatch (server has no window)
  const cookieAuth = mounted && typeof window !== "undefined" && isCookieAuth();
  const authenticated = !!accessToken || cookieAuth || !!user;

  const fetchImsProfile = useCallback(async (token) => {
    const res = await fetch("/api/auth/ims/profile", {
      headers: { Authorization: token },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name,
      email: data.email,
      sub: data.sub,
      picture: data.picture,
      avatar: data.avatar,
    };
  }, []);

  const handleImsAuthenticated = useCallback(
    async (token) => {
      setAccessToken(token);
      setAuthProvider("ims_implicit");
      const profile = await fetchImsProfile(token);
      if (profile) setUser(profile);
    },
    [fetchImsProfile]
  );

  const performSilentRefresh = useCallback(() => {
    const clientId = getAdobeClientId();
    if (!clientId) return Promise.resolve(null);

    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = `${IMS_AUTHORIZE_URL}?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: window.location.href,
        scope: SCOPE,
        response_type: "token",
        prompt: "none",
      }).toString()}`;

      const timeout = setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
        window.removeEventListener("message", handleMessage);
        resolve(null);
      }, 10000);

      const handleMessage = (event) => {
        if (event.origin !== "https://ims-na1.adobelogin.com") return;
        try {
          const url = new URL(event.data);
          const params = new URLSearchParams(url.hash?.substring(1) || "");
          const { accessToken: tok, expiresIn } = parseTokenFromParams(params);
          clearTimeout(timeout);
          if (iframe.parentNode) document.body.removeChild(iframe);
          window.removeEventListener("message", handleMessage);
          if (tok) {
            const token = `Bearer ${tok}`;
            const expiresAt = Date.now() + (expiresIn ? parseInt(expiresIn, 10) : 3600) * 1000;
            localStorage.setItem("accessToken", token);
            localStorage.setItem("tokenExpiresAt", String(expiresAt));
            setAccessToken(token);
            resolve(token);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };

      window.addEventListener("message", handleMessage);
      document.body.appendChild(iframe);
    });
  }, []);

  const setupTokenRefresh = useCallback(() => {
    const expiresAt = localStorage.getItem("tokenExpiresAt");
    if (!expiresAt) return;
    const refreshTime = parseInt(expiresAt, 10) - FIVE_MIN_MS;
    const timeUntilRefresh = refreshTime - Date.now();
    if (timeUntilRefresh > 0) {
      setTimeout(() => performSilentRefresh(), timeUntilRefresh);
    }
  }, [performSilentRefresh]);

  const signIn = useCallback(() => {
    if (isImsImplicitConfigured() && !cookieAuth) {
      try {
        sessionStorage.setItem("postSignInRedirect", window.location.href);
      } catch {
        // ignore
      }
      const params = new URLSearchParams({
        client_id: getAdobeClientId(),
        redirect_uri: window.location.href,
        scope: SCOPE,
        response_type: "token",
      });
      window.location.href = `${IMS_AUTHORIZE_URL}?${params.toString()}`;
    } else {
      window.location.href = signInUrl;
    }
  }, [cookieAuth, signInUrl]);

  const signOut = useCallback(async () => {
    setUser(null);
    setAuthProvider(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenExpiresAt");

    if (authProvider === "entra" && logoutUrl) {
      window.location.href = logoutUrl;
    } else if (authProvider === "ims_implicit" || authProvider === "cookie") {
      window.location.href = "/";
    } else {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/";
    }
  }, [authProvider, logoutUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // When IMS implicit is configured, AdobeSignInButton handles URL token parsing.
    // Skip here to avoid duplicate processing and race conditions.
    const imsHandlesUrl = isImsImplicitConfigured() && !cookieAuth;

    const processToken = async (tok, expiresIn) => {
      const token = `Bearer ${tok}`;
      const expiresAt = Date.now() + (expiresIn ? parseInt(expiresIn, 10) : 3600) * 1000;
      localStorage.setItem("accessToken", token);
      localStorage.setItem("tokenExpiresAt", String(expiresAt));
      setAccessToken(token);
      const profile = await fetchImsProfile(token);
      if (profile) setUser(profile);
      setAuthProvider("ims_implicit");
      setupTokenRefresh();
      window.location.replace(getCleanRedirectTarget());
    };

    if (!imsHandlesUrl && window.location.hash) {
      try {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const { accessToken: tok, expiresIn, error: err, errorDescription } = parseTokenFromParams(params);
        if (err) {
          console.error("OAuth error:", err, errorDescription);
          setLoading(false);
          return;
        }
        if (tok) {
          processToken(tok, expiresIn);
          return;
        }
      } catch {
        // fall through
      }
    }

    if (!imsHandlesUrl && window.location.search?.includes("access_token=")) {
      try {
        const params = new URLSearchParams(window.location.search.substring(1));
        const { accessToken: tok, expiresIn, error: err } = parseTokenFromParams(params);
        if (!err && tok) {
          processToken(tok, expiresIn);
          return;
        }
      } catch {
        // fall through
      }
    }

    if (!imsHandlesUrl && window.location.pathname?.includes("access_token")) {
      try {
        const idx = window.location.pathname.indexOf("access_token=");
        if (idx !== -1) {
          const params = new URLSearchParams(window.location.pathname.substring(idx));
          const { accessToken: tok, expiresIn, error: err } = parseTokenFromParams(params);
          if (!err && tok) {
            processToken(tok, expiresIn);
            return;
          }
        }
      } catch {
        // fall through
      }
    }

    const storedToken = localStorage.getItem("accessToken");
    const storedExpiresAt = localStorage.getItem("tokenExpiresAt");

    if (storedToken && storedExpiresAt) {
      const expiresAt = parseInt(storedExpiresAt, 10);
      if (Date.now() >= expiresAt - FIVE_MIN_MS) {
        performSilentRefresh().then((refreshed) => {
          if (refreshed) {
            setupTokenRefresh();
            fetchImsProfile(refreshed).then((p) => p && setUser(p));
            setAuthProvider("ims_implicit");
          } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("tokenExpiresAt");
          }
          setLoading(false);
        });
        return;
      }
      setAccessToken(storedToken);
      setAuthProvider("ims_implicit");
      fetchImsProfile(storedToken).then((p) => p && setUser(p));
      setupTokenRefresh();
      setLoading(false);
      return;
    }

    if (cookieAuth) {
      setAuthProvider("cookie");
      fetch("/auth/user", { credentials: "include" })
        .then((res) => res.ok && res.json())
        .then((data) => setUser(data))
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

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
  }, [cookieAuth, fetchImsProfile, performSilentRefresh, setupTokenRefresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authenticated,
      authProvider,
      accessToken,
      signIn,
      signOut,
      handleImsAuthenticated,
    }),
    [user, loading, authenticated, authProvider, accessToken, signIn, signOut, handleImsAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
