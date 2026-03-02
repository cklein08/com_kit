"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAdobeClientId } from "@/lib/auth/config";

const IMS_AUTHORIZE_URL = "https://ims-na1.adobelogin.com/ims/authorize/v2";
const SCOPE = "AdobeID,openid,read_organizations,additional_info.projectedProductContext";
const FIVE_MIN_MS = 5 * 60 * 1000;

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
  return `${window.location.origin}${window.location.pathname || "/"}`;
}

function parseTokenFromParams(params) {
  const accessToken = params.get("access_token");
  const expiresIn = params.get("expires_in");
  const error = params.get("error");
  const errorDescription = params.get("error_description");
  return { accessToken, expiresIn, error, errorDescription };
}

/**
 * AdobeSignInButton – IMS implicit flow (token in localStorage).
 * Redirect, parse token from hash/query/pathname, silent refresh, sign out.
 */
export function AdobeSignInButton({ onAuthenticated, onSignOut, authenticated: externalAuth }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [internalAuth, setInternalAuth] = useState(false);
  const isAuthenticated = externalAuth ?? internalAuth;

  const clientId = getAdobeClientId();

  const performSilentRefresh = useCallback(
    () =>
      new Promise((resolve) => {
        const redirectUri = window.location.href;
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = `${IMS_AUTHORIZE_URL}?${new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: SCOPE,
          response_type: "token",
          prompt: "none",
        }).toString()}`;

        const timeout = setTimeout(() => {
          cleanup();
          resolve(null);
        }, 10000);

        const cleanup = () => {
          clearTimeout(timeout);
          if (iframe.parentNode) document.body.removeChild(iframe);
          window.removeEventListener("message", handleMessage);
        };

        const handleMessage = (event) => {
          if (event.origin !== "https://ims-na1.adobelogin.com") return;
          try {
            const url = new URL(event.data);
            const params = new URLSearchParams(url.hash?.substring(1) || "");
            const { accessToken, expiresIn, error: err } = parseTokenFromParams(params);
            cleanup();
            if (err) {
              resolve(null);
              return;
            }
            if (accessToken) {
              const token = `Bearer ${accessToken}`;
              const expiresAt =
                Date.now() + (expiresIn ? parseInt(expiresIn, 10) : 3600) * 1000;
              localStorage.setItem("accessToken", token);
              localStorage.setItem("tokenExpiresAt", String(expiresAt));
              setInternalAuth(true);
              onAuthenticated?.(token);
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
      }),
    [clientId, onAuthenticated]
  );

  const isTokenExpired = useCallback(() => {
    const expiresAt = localStorage.getItem("tokenExpiresAt");
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt, 10) - FIVE_MIN_MS;
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

  const handleSignIn = useCallback(() => {
    setError(null);
    setLoading(true);
    if (!clientId) {
      const msg = "Add NEXT_PUBLIC_ADOBE_CLIENT_ID to .env or run: node scripts/generate-runtime-config.cjs";
      setError(msg);
      toast.error("Sign-in not configured", { description: msg });
      setLoading(false);
      return;
    }
    try {
      sessionStorage.setItem("postSignInRedirect", window.location.href);
    } catch {
      // ignore
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: window.location.href,
      scope: SCOPE,
      response_type: "token",
    });
    window.location.href = `${IMS_AUTHORIZE_URL}?${params.toString()}`;
  }, [clientId]);

  const handleSignOut = useCallback(() => {
    setInternalAuth(false);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenExpiresAt");
    setError(null);
    onSignOut?.();
  }, [onSignOut]);

  const processToken = useCallback(
    (accessToken, expiresIn) => {
      const token = `Bearer ${accessToken}`;
      const expiresAt =
        Date.now() + (expiresIn ? parseInt(expiresIn, 10) : 3600) * 1000;
      localStorage.setItem("accessToken", token);
      localStorage.setItem("tokenExpiresAt", String(expiresAt));
      setInternalAuth(true);
      onAuthenticated?.(token);
      setupTokenRefresh();
      setLoading(false);
      window.location.replace(getCleanRedirectTarget());
    },
    [onAuthenticated, setupTokenRefresh]
  );

  useEffect(() => {
    if (window.location.hash) {
      try {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const { accessToken, expiresIn, error: err, errorDescription } = parseTokenFromParams(params);
        if (err) {
          setError(`OAuth error: ${err} - ${errorDescription || "No description"}`);
          setLoading(false);
          return;
        }
        if (accessToken) {
          processToken(accessToken, expiresIn);
          return;
        }
      } catch {
        setError("Error parsing authentication response");
        setLoading(false);
        return;
      }
    }

    if (window.location.search?.includes("access_token=")) {
      try {
        const params = new URLSearchParams(window.location.search.substring(1));
        const { accessToken, expiresIn, error: err, errorDescription } = parseTokenFromParams(params);
        if (err) {
          setError(`OAuth error: ${err} - ${errorDescription || "No description"}`);
          setLoading(false);
          return;
        }
        if (accessToken) {
          processToken(accessToken, expiresIn);
          return;
        }
      } catch {
        setError("Error parsing authentication response from URL");
        setLoading(false);
        return;
      }
    }

    if (window.location.pathname?.includes("access_token")) {
      try {
        const pathString = window.location.pathname;
        const tokenStartIndex = pathString.indexOf("access_token=");
        if (tokenStartIndex !== -1) {
          const params = new URLSearchParams(pathString.substring(tokenStartIndex));
          const { accessToken, expiresIn, error: err, errorDescription } = parseTokenFromParams(params);
          if (err) {
            setError(`OAuth error: ${err} - ${errorDescription || "No description"}`);
            setLoading(false);
            return;
          }
          if (accessToken) {
            processToken(accessToken, expiresIn);
            return;
          }
        }
      } catch {
        setError("Error parsing authentication response from path");
        setLoading(false);
        return;
      }
    }

    const storedToken = localStorage.getItem("accessToken");
    const storedExpiresAt = localStorage.getItem("tokenExpiresAt");

    if (storedToken && storedExpiresAt) {
      if (isTokenExpired()) {
        performSilentRefresh().then((refreshed) => {
          if (refreshed) {
            setupTokenRefresh();
          } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("tokenExpiresAt");
            setInternalAuth(false);
          }
          setLoading(false);
        });
        return;
      }
      setInternalAuth(true);
      onAuthenticated?.(storedToken);
      setupTokenRefresh();
    }
    setLoading(false);
  }, [onAuthenticated, isTokenExpired, performSilentRefresh, setupTokenRefresh, processToken]);

  return (
    <>
      <button
        type="button"
        onClick={isAuthenticated ? handleSignOut : handleSignIn}
        disabled={loading}
        className={isAuthenticated ? "hover:underline text-sm" : "hover:underline"}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading
          ? (isAuthenticated ? "Signing out…" : "Signing in…")
          : (isAuthenticated ? "Sign Out" : "Sign In")}
      </button>
      {error && (
        <div className="mt-2 text-sm text-destructive">{error}</div>
      )}
    </>
  );
}
