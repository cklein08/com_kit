"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";

function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (value && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  if (!value) return null;
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-sm h-8" />
        <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function VisualizationPanel({ showVse, hubname, locale, contentId }) {
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs" htmlFor="toolbar-show-info">
          Show information
        </Label>
        <Switch id="toolbar-show-info" checked={showInfo} onCheckedChange={setShowInfo} />
      </div>
      {showVse && showInfo && (
        <>
          <CopyField label="Hub Name" value={hubname} />
          <CopyField label="VSE" value={showVse} />
          <CopyField label="Locale" value={locale} />
          <CopyField label="Content ID" value={contentId} />
        </>
      )}
    </div>
  );
}
