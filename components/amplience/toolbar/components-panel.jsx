"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  AMPLIENCE_COMPONENTS,
  AEM_BLOCK_TYPES,
} from "@/lib/amplience/component-registry";
import { DEFAULT_AEM_EDITOR_URL } from "@/lib/constants";

export function ComponentsPanel() {
  const [aemEnv, setAemEnv] = useState(DEFAULT_AEM_EDITOR_URL);

  useEffect(() => {
    if (typeof globalThis.window !== "undefined") {
      const stored = globalThis.localStorage.getItem("aemEnvironment");
      if (stored) setAemEnv(stored);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
          Amplience components
        </p>
        <p className="mb-2 text-xs text-zinc-600">
          Click &quot;Add component&quot; in a drop zone on the page to add Banner or Carousel. The dialog opens on the same page.
        </p>
        <ul className="space-y-1">
          {AMPLIENCE_COMPONENTS.map((comp) => {
            const Icon = comp.icon;
            return (
              <li key={comp.schemaUri} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-600">
                {Icon ? <Icon className="h-4 w-4 text-zinc-500 shrink-0" /> : null}
                <span>{comp.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
          AEM blocks
        </p>
        <p className="mb-2 text-xs text-zinc-600">
          Edit in Adobe Universal Editor. Open this page from AEM to add blocks.
        </p>
        <ul className="space-y-1">
          {AEM_BLOCK_TYPES.map((block) => (
            <li key={block.modelTitle} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-600">
              <span>{block.label}</span>
              <span className="text-xs text-zinc-400">({block.modelTitle})</span>
            </li>
          ))}
        </ul>
        <a
          href={`${aemEnv.replace(/\/$/, "")}/editor.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          Open Universal Editor
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
