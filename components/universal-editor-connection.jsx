"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { DEFAULT_AEM_EDITOR_URL, UE_CORS_SCRIPT_URL } from "@/lib/constants";

const META_NAME = "urn:adobe:aue:system:aemconnection";

/**
 * Only runs when the page is opened in an iframe (from AEM Universal Editor).
 * Does NOT run when visiting directly with ?vse= in the URL.
 * Opening AEM in UE should only happen when the user clicks "Open Universal Editor" in the Components panel dialog.
 */
function isInIframe() {
  if (typeof globalThis.window === "undefined") return false;
  return globalThis.window.self !== globalThis.window.top;
}

/**
 * Injects the Universal Editor connection meta tag and loads the UE CORS script
 * only when the page is opened from AEM (in an iframe). Does not run when visiting
 * directly with ?vse= (Amplience mode). Opening AEM/UE happens only when the user
 * clicks "Open Universal Editor" in the Components panel.
 */
export function UniversalEditorConnection() {
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    setInIframe(isInIframe());
  }, []);

  useEffect(() => {
    if (!inIframe || typeof document === "undefined") return;
    const aemEnv = localStorage.getItem("aemEnvironment") || DEFAULT_AEM_EDITOR_URL;
    const content = `aem:${aemEnv}`;
    let meta = document.querySelector(`meta[name="${META_NAME}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", META_NAME);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }, [inIframe]);

  if (!inIframe) return null;
  return <Script src={UE_CORS_SCRIPT_URL} async />;
}
