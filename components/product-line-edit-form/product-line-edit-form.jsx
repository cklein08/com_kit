"use client";

import { useState, useEffect, useCallback } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export const PRODUCT_LINE_TYPES = [
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search catalog to add products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
          }}
          className="pl-9"
        />
        {open && (
          <div
            className="absolute top-full left-0 right-0 z-[100] mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md"
            onMouseDown={(e) => e.preventDefault()}
          >
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(p);
                      }}
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
        )}
      </div>
    </div>
  );
}

/**
 * Shared product line edit form for carousel and PLP.
 * @param {object} props
 * @param {object} [props.initialConfig] - { productLineType, searchPhrase, category, skus, title? }
 * @param {string|null} props.contentId - Amplience content ID for saving
 * @param {function} props.onSave - (payload) => Promise
 * @param {function} props.onClose - () => void
 * @param {boolean} [props.showTitle=true] - Show title field (carousel) or hide (PLP)
 * @param {string} [props.defaultTitle="Running shoes"] - Default title when showTitle is false (for API payload)
 * @param {string} [props.saveSuccessMessage="Saved"] - Toast message on success
 * @param {string} [props.noContentMessage] - Message when contentId is missing
 */
export function ProductLineEditForm({
  initialConfig,
  contentId,
  onSave,
  onClose,
  showTitle = true,
  defaultTitle = "Running shoes",
  saveSuccessMessage = "Saved",
  noContentMessage = "Create content in Amplience first to enable saving.",
}) {
  const [title, setTitle] = useState(initialConfig?.title ?? defaultTitle);
  const [productLineType, setProductLineType] = useState(
    initialConfig?.productLineType ?? "search"
  );
  const [searchPhrase, setSearchPhrase] = useState(
    initialConfig?.searchPhrase ?? "running shoes"
  );
  const [category, setCategory] = useState(initialConfig?.category ?? "");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

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
      setSaveError(noContentMessage);
      toast.error(noContentMessage);
      return;
    }
    if (productLineType === "search" && !searchPhrase.trim()) {
      toast.error("Search phrase is required when using Search phrase.");
      setSaveError("Search phrase is required.");
      return;
    }
    if (productLineType === "category" && !category.trim()) {
      toast.error("Category is required when using Category.");
      setSaveError("Category is required.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const payload = {
        title: showTitle ? (title.trim() || defaultTitle) : defaultTitle,
        productLineType,
        searchPhrase: productLineType === "search" ? searchPhrase.trim() : "",
        category: productLineType === "category" ? category.trim() : "",
        skus:
          productLineType === "skuList"
            ? selectedProducts.map((p) => p.sku)
            : [],
      };
      await onSave(payload);
      toast.success(saveSuccessMessage);
      onClose();
    } catch (err) {
      const msg = err.message || "Save failed";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
        >
          <p className="flex-1 text-sm text-destructive">{saveError}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSaveError(null)}
            className="shrink-0 text-destructive hover:bg-destructive/20"
            aria-label="Close error"
          >
            Cancel
          </Button>
        </div>
      )}
      {showTitle && (
        <div>
          <label htmlFor="product-line-title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="product-line-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Running shoes"
            className="mt-1"
          />
        </div>
      )}

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
          <label htmlFor="product-line-search" className="text-sm font-medium">
            Search phrase
          </label>
          <Input
            id="product-line-search"
            value={searchPhrase}
            onChange={(e) => setSearchPhrase(e.target.value)}
            placeholder="e.g. running shoes"
            className="mt-1"
          />
        </div>
      )}

      {productLineType === "category" && (
        <div>
          <label htmlFor="product-line-category" className="text-sm font-medium">
            Category
          </label>
          <Input
            id="product-line-category"
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
        <Button
          type="submit"
          disabled={
            !contentId ||
            saving ||
            (productLineType === "search" && !searchPhrase.trim()) ||
            (productLineType === "category" && !category.trim())
          }
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
