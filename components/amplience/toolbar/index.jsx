"use client";

import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { VisualizationPanel } from "./visualization-panel";
import { EnvironmentsPanel } from "./environments-panel";
import { SitesPanel } from "./sites-panel";
import { ThemePickerPanel } from "./theme-picker-panel";
import { ComponentsPanel } from "./components-panel";
import { PanelRightOpen, X } from "lucide-react";
import { getAmplienceConfig } from "@/lib/amplience/config-client";

function inIframe() {
  try {
    return typeof globalThis.window !== "undefined" && globalThis.window.self !== globalThis.window.top;
  } catch {
    return true;
  }
}

export function AmplienceToolbar({ vse, hubname, contentId, locale }) {
  const [isOpen, setIsOpen] = useState(true);
  const [openedPanels, setOpenedPanels] = useState([]);
  const [serverConfig, setServerConfig] = useState(null);
  const staticConfig = getAmplienceConfig();
  const envs = serverConfig?.envs ?? staticConfig.envs ?? [];
  const visualisations = serverConfig?.visualisations ?? staticConfig.visualisations ?? [];
  const themes = serverConfig?.themes ?? staticConfig.themes ?? [];
  useEffect(() => {
    fetch("/api/amplience/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setServerConfig(data))
      .catch(() => {});
  }, []);

  const clearVse = () => {
    if (typeof globalThis.document !== "undefined") {
      globalThis.document.cookie = "vse=; max-age=0;";
      globalThis.document.cookie = "vse-timestamp=; max-age=0;";
    }
    globalThis.window.location.assign("/");
  };

  const items = [
    {
      value: "0",
      title: "Visualization",
      Component: VisualizationPanel,
      visible: !!vse,
      props: { showVse: vse, hubname, locale, contentId },
    },
    {
      value: "1",
      title: "Environments",
      Component: EnvironmentsPanel,
      visible: !!vse && envs.length > 0,
      props: { vse, hubname, envs },
    },
    {
      value: "2",
      title: "Sites",
      Component: SitesPanel,
      visible: visualisations.length > 0,
      props: { visualisations },
    },
    {
      value: "3",
      title: "Theme",
      Component: ThemePickerPanel,
      visible: themes.length > 0,
      props: { themes },
    },
    {
      value: "4",
      title: "Components",
      Component: ComponentsPanel,
      visible: !!vse,
      props: { hubname },
    },
  ].filter((i) => i.visible);

  return (
    <div className="fixed top-[20%] right-0 z-50 flex">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-l-md rounded-r-none border-r-0"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close toolbar" : "Open toolbar"}
        style={{ opacity: isOpen ? 0 : 1, pointerEvents: isOpen ? "none" : "auto" }}
      >
        <PanelRightOpen className="h-4 w-4" />
      </Button>
      {isOpen && (
        <div className="w-[min(400px,100vw)] border bg-background shadow-lg rounded-l-md overflow-hidden flex flex-col max-h-[100vh]">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Amplience Integration</span>
            <div className="flex gap-1">
              {!inIframe() && (
                <Button type="button" variant="ghost" size="sm" onClick={clearVse}>
                  Exit
                </Button>
              )}
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Accordion type="multiple" value={openedPanels} onValueChange={setOpenedPanels} className="overflow-y-auto">
            {items.map(({ value, title, Component, props }) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger className="px-3 py-2 text-xs uppercase">{title}</AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <Component {...props} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
