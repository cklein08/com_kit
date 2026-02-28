"use client";

import { useEffect } from "react";
import { DEFAULT_AEM_EDITOR_URL } from "@/lib/constants";

const META_NAME = "urn:adobe:aue:system:aemconnection";

/**
 * Injects or updates the Universal Editor connection meta tag so it uses the
 * AEM author URL from app config (localStorage) or env (NEXT_PUBLIC_AEM_EDITOR_URL).
 * Required for the Universal Editor to persist edits to the correct AEM instance.
 * For localhost: set NEXT_PUBLIC_AEM_EDITOR_URL to your local AEM over HTTPS (e.g. https://localhost:8443).
 */
export function UniversalEditorConnection() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const aemEnv = localStorage.getItem("aemEnvironment") || DEFAULT_AEM_EDITOR_URL;
    const content = `aem:${aemEnv}`;
    let meta = document.querySelector(`meta[name="${META_NAME}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", META_NAME);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }, []);
  return null;
}
