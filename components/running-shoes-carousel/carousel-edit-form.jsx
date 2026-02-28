"use client";

import { useState, useEffect, useCallback } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X } from "lucide-react";

const PRODUCT_LINE_TYPES = [
  { value: "search", label: "Search phrase" },
  { value: "category", label: "Category" },
  { value: "skuList", label: "Product list (SKUs)" },
];

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function ProductPicker({ selectedProducts, onAdd, onRemove }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const selectedSkus = new Set(selectedProducts.map((p) => p.sku));

  const fetchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/catalog/products?search=${encodeURIComponent(query)}&pageSize=10`
      );
      const data = res.ok ? await res.json() : { products: [] };
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(debouncedSearch);
  }, [debouncedSearch, fetchProducts]);

  const handleSelect = (product) => {
    if (selectedSkus.has(product.sku)) return;
    onAdd(product);
    setSearch("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Products from catalog</label>
      <div className="flex flex-wrap gap-2">
        {selectedProducts.map((p) => (
          <span
            key={p.sku}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-muted px-2 py-1 text-sm"
          >
            {p.name || p.sku}
            <button
              type="button"
              onClick={() => onRemove(p.sku)}
              className="rounded p-0.5 hover:bg-muted-foreground/20"
              aria-label={`Remove ${p.sku}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search catalog to add products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setOpen(true)}
              className="pl-9"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {debouncedSearch.trim()
                  ? "No products found"
                  : "Type to search catalog"}
              </div>
            ) : (
              <ul className="py-1">
                {results.map((p) => (
                  <li key={p.sku}>
                    <button
                      type="button"
                      onClick={() => handleSelect(p)}
                      disabled={selectedSkus.has(p.sku)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {p.image && (
                        <img
                          src={p.image}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                      )}
                      <span className="truncate">{p.name || p.sku}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {p.sku}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CarouselEditForm({
  initialConfig,
  contentId,
  onSave,
  onClose,
}) {
  const [title, setTitle] = useState(initialConfig?.title ?? "Running shoes");
  const [productLineType, setProductLineType] = useState(
    initialConfig?.productLineType ?? "search"
  );
  const [searchPhrase, setSearchPhrase] = useState(
    initialConfig?.searchPhrase ?? "running shoes"
  );
  const [category, setCategory] = useState(initialConfig?.category ?? "");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const skus = initialConfig?.skus;
    if (!Array.isArray(skus) || skus.length === 0) {
      setSelectedProducts([]);
      return;
    }
    fetch(
      `/api/catalog/products?skus=${encodeURIComponent(skus.join(","))}`
    )
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => {
        const products = (data.products || []).map((p) => ({
          sku: p.sku,
          name: p.name,
        }));
        const order = skus;
        const ordered = order
          .map((sku) => products.find((p) => p.sku === sku))
          .filter(Boolean);
        const missing = order.filter(
          (sku) => !products.some((p) => p.sku === sku)
        );
        setSelectedProducts([
          ...ordered,
          ...missing.map((sku) => ({ sku, name: sku })),
        ]);
      })
      .catch(() => setSelectedProducts(skus.map((sku) => ({ sku, name: sku }))));
  }, [initialConfig?.skus]);

  const handleAddProduct = (product) => {
    setSelectedProducts((prev) => [...prev, { sku: product.sku, name: product.name }]);
  };

  const handleRemoveProduct = (sku) => {
    setSelectedProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentId) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || "Running shoes",
        productLineType,
        searchPhrase: productLineType === "search" ? searchPhrase.trim() : undefined,
        category: productLineType === "category" ? category.trim() : undefined,
        skus:
          productLineType === "skuList"
            ? selectedProducts.map((p) => p.sku)
            : undefined,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="carousel-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="carousel-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Running shoes"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Product line type</label>
        <Select
          value={productLineType}
          onValueChange={setProductLineType}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_LINE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {productLineType === "search" && (
        <div>
          <label htmlFor="carousel-search" className="text-sm font-medium">
            Search phrase
          </label>
          <Input
            id="carousel-search"
            value={searchPhrase}
            onChange={(e) => setSearchPhrase(e.target.value)}
            placeholder="e.g. running shoes"
            className="mt-1"
          />
        </div>
      )}

      {productLineType === "category" && (
        <div>
          <label htmlFor="carousel-category" className="text-sm font-medium">
            Category
          </label>
          <Input
            id="carousel-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. running"
            className="mt-1"
          />
        </div>
      )}

      {productLineType === "skuList" && (
        <ProductPicker
          selectedProducts={selectedProducts}
          onAdd={handleAddProduct}
          onRemove={handleRemoveProduct}
        />
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!contentId || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
