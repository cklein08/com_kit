"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";

const STORAGE_KEY = "amplience-theme";

const AmplienceThemeContext = createContext({
  themeId: "default",
  setThemeId: () => {},
});

export function useAmplienceTheme() {
  const ctx = useContext(AmplienceThemeContext);
  return ctx;
}

export function AmplienceThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState("default");

  useEffect(() => {
    const stored = globalThis.localStorage !== undefined
      ? globalThis.localStorage.getItem(STORAGE_KEY)
      : null;
    if (stored && stored !== "default") {
      setThemeIdState(stored);
    }
  }, []);

  const setThemeId = useCallback((id) => {
    setThemeIdState(id ?? "default");
    if (globalThis.localStorage !== undefined) {
      if (!id || id === "default") {
        globalThis.localStorage.removeItem(STORAGE_KEY);
      } else {
        globalThis.localStorage.setItem(STORAGE_KEY, id);
      }
    }
  }, []);

  const value = useMemo(
    () => ({ themeId: themeId || "default", setThemeId }),
    [themeId, setThemeId]
  );

  return (
    <AmplienceThemeContext.Provider value={value}>
      {children}
    </AmplienceThemeContext.Provider>
  );
}

export { STORAGE_KEY };
