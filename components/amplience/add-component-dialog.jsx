"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AMPLIENCE_COMPONENTS,
  TUTORIAL_BANNER_SCHEMA,
  PRODUCT_CAROUSEL_SCHEMA,
} from "@/lib/amplience/component-registry";
import { ProductLineEditForm } from "@/components/product-line-edit-form/product-line-edit-form";

/**
 * Dialog for adding a component to a slot. Opens the appropriate form (Banner or Carousel)
 * based on the selected component type. Stays on the same page instead of redirecting.
 */
export function AddComponentDialog({ open, onOpenChange, slotKey, label }) {
  const [selectedComponent, setSelectedComponent] = useState(null);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) setSelectedComponent(null);
    onOpenChange(nextOpen);
  };

  const handleSelectComponent = (comp) => {
    setSelectedComponent(comp);
  };

  const handleBack = () => {
    setSelectedComponent(null);
  };

  const component = selectedComponent;
  const isBanner = component?.schemaUri === TUTORIAL_BANNER_SCHEMA;
  const isCarousel = component?.schemaUri === PRODUCT_CAROUSEL_SCHEMA;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {component
              ? `Add ${component.label}`
              : `Add to ${label || slotKey}`}
          </DialogTitle>
        </DialogHeader>

        {!component ? (
          <div className="space-y-1">
            {AMPLIENCE_COMPONENTS.map((comp) => {
              const Icon = comp.icon;
              return (
                <button
                  key={comp.schemaUri}
                  type="button"
                  onClick={() => handleSelectComponent(comp)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-100"
                >
                  {Icon ? <Icon className="h-4 w-4 text-zinc-500 shrink-0" /> : null}
                  <span>{comp.label}</span>
                </button>
              );
            })}
          </div>
        ) : isBanner ? (
          <BannerForm
            slotKey={slotKey}
            onSuccess={() => setSelectedComponent(null)}
            onClose={() => handleOpenChange(false)}
          />
        ) : isCarousel ? (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2 -ml-2"
            >
              ← Back
            </Button>
            <CarouselForm
              slotKey={slotKey}
              onSuccess={() => setSelectedComponent(null)}
              onClose={() => handleOpenChange(false)}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BannerForm({ slotKey, onSuccess, onClose }) {
  const [headline, setHeadline] = useState("");
  const [strapline, setStrapline] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = {
        headline: {
          _meta: { schema: "https://schema-examples.com/text" },
          text: headline.trim() || "New banner",
        },
        strapline: {
          _meta: { schema: "https://schema-examples.com/text" },
          text: strapline.trim() || "",
        },
        link: linkUrl.trim()
          ? { url: linkUrl.trim(), title: linkTitle.trim() || "Learn more" }
          : undefined,
      };

      const res = await fetch("/api/amplience/content/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: headline.trim() || "Banner",
          schemaUri: TUTORIAL_BANNER_SCHEMA,
          body,
          deliveryKey: slotKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");

      toast.success("Banner created");
      if (typeof globalThis.window !== "undefined") {
        globalThis.window.dispatchEvent(
          new CustomEvent("amplience-slot-refresh", { detail: { slotKey } })
        );
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      <div>
        <label htmlFor="banner-headline" className="text-sm font-medium">
          Headline
        </label>
        <Input
          id="banner-headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. New Season"
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="banner-strapline" className="text-sm font-medium">
          Strapline
        </label>
        <Input
          id="banner-strapline"
          value={strapline}
          onChange={(e) => setStrapline(e.target.value)}
          placeholder="e.g. Discover the latest arrivals"
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="banner-link-url" className="text-sm font-medium">
          Link URL
        </label>
        <Input
          id="banner-link-url"
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="banner-link-title" className="text-sm font-medium">
          Link title
        </label>
        <Input
          id="banner-link-title"
          value={linkTitle}
          onChange={(e) => setLinkTitle(e.target.value)}
          placeholder="e.g. Shop Now"
          className="mt-1"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CarouselForm({ slotKey, onSuccess, onClose }) {
  const handleCreate = async (payload) => {
    const res = await fetch("/api/amplience/content/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: payload.title || "Carousel",
        schemaUri: PRODUCT_CAROUSEL_SCHEMA,
        body: {
          title: payload.title || "Featured products",
          productLineType: payload.productLineType || "search",
          searchPhrase: payload.searchPhrase || "",
          category: payload.category || "",
          skus: payload.skus || [],
        },
        deliveryKey: slotKey,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Create failed");

    if (typeof globalThis.window !== "undefined") {
      globalThis.window.dispatchEvent(
        new CustomEvent("amplience-slot-refresh", { detail: { slotKey } })
      );
    }
    onSuccess?.();
  };

  return (
    <ProductLineEditForm
      initialConfig={{
        title: "Featured products",
        productLineType: "search",
        searchPhrase: "running shoes",
        category: "",
        skus: [],
      }}
      contentId="create"
      onSave={handleCreate}
      onClose={onClose}
      showTitle={true}
      defaultTitle="Featured products"
      saveSuccessMessage="Carousel created"
      noContentMessage=""
    />
  );
}
