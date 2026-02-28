"use client";

import { Button } from "@/components/ui/button";

/**
 * Environments panel: switch Amplience environment (hub + VSE).
 * Reloads the page with the selected env's VSE so preview uses that backend.
 */
export function EnvironmentsPanel({ vse, hubname, envs }) {
  if (!vse || !envs?.length) return null;

  const handleSwitch = (env) => {
    const url = new URL(window.location.href);
    url.searchParams.set("vse", env.vse);
    url.searchParams.delete("vse-timestamp");
    window.location.href = url.toString();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Switch environment to preview with a different hub/VSE.</p>
      {envs.map((env) => (
        <Button
          key={env.hub}
          type="button"
          variant={env.hub === hubname ? "default" : "outline"}
          size="sm"
          className="w-full justify-start"
          onClick={() => handleSwitch(env)}
        >
          {env.name} ({env.hub})
        </Button>
      ))}
    </div>
  );
}
