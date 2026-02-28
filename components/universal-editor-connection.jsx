"use client";

import { useEffect } from "react";

const META_NAME = "urn:adobe:aue:system:aemconnection";
const DEFAULT_AEM_URL = "https://author-p124903-e1367755.adobeaemcloud.com";

/**
 * Injects or updates the Universal Editor connection meta tag so it uses the
 * AEM author URL from app config (localStorage). Required for the Universal
 * Editor to persist edits to the correct AEM instance.
 */
export function UniversalEditorConnection() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const aemEnv = localStorage.getItem("aemEnvironment") || DEFAULT_AEM_URL;
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
