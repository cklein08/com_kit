"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAmplienceTheme } from "../amplience-theme-context";

/**
 * Theme picker panel: selectable list of visual themes from the library.
 * On select, updates theme context so only the page content (not the toolbar) gets
 * the palette. Persists choice in localStorage.
 */
export function ThemePickerPanel({ themes }) {
  const { themeId: currentThemeId, setThemeId } = useAmplienceTheme();

  const applyTheme = (themeId) => {
    setThemeId(themeId === "default" ? "default" : themeId);
  };

  if (!themes?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Choose a palette to preview the page. Does not change the toolbar.</p>
      <div className="grid grid-cols-1 gap-1.5">
        {themes.map((theme) => {
          const isSelected = currentThemeId === theme.id;
          return (
            <Button
              key={theme.id}
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => applyTheme(theme.id)}
            >
              {isSelected ? <Check className="h-4 w-4 shrink-0" /> : <span className="w-4 shrink-0" />}
              <span className="font-medium">{theme.name}</span>
              {theme.description ? (
                <span className="text-muted-foreground truncate">— {theme.description}</span>
              ) : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
