"use client";

import { useAmplienceTheme } from "./amplience-theme-context";

/**
 * Wraps page content so that the Amplience theme (blue, green, etc.) applies only
 * to the page, not to the toolbar popout. The toolbar stays with default styling.
 */
export function AmplienceThemeContentWrapper({ children }) {
  const { themeId } = useAmplienceTheme();
  const themeAttr = themeId && themeId !== "default" ? themeId : undefined;
  return (
    <div data-amplience-theme={themeAttr} className="min-h-full">
      {children}
    </div>
  );
}
