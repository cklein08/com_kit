"use client";

import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";

const WISHLIST_STORAGE_KEY = "wknd-wishlist";

function loadWishlist() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveWishlist(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadWishlist());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveWishlist(items);
  }, [mounted, items]);

  const addItem = useCallback((product) => {
    const sku = typeof product === "object" ? product.sku : product;
    if (!sku) return;
    setItems((prev) => {
      if (prev.some((i) => i.sku === sku)) return prev;
      const name = typeof product === "object" ? product.name ?? "" : "";
      const imageUrl = typeof product === "object" && product.images?.[0]?.url ? product.images[0].url : null;
      return [...prev, { sku, name, imageUrl }];
    });
  }, []);

  const removeItem = useCallback((sku) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const toggleItem = useCallback((product) => {
    const sku = typeof product === "object" ? product.sku : product;
    if (!sku) return;
    setItems((prev) => {
      const inList = prev.some((i) => i.sku === sku);
      if (inList) return prev.filter((i) => i.sku !== sku);
      const name = typeof product === "object" ? product.name ?? "" : "";
      const imageUrl = typeof product === "object" && product.images?.[0]?.url ? product.images[0].url : null;
      return [...prev, { sku, name, imageUrl }];
    });
  }, []);

  const isInWishlist = useCallback(
    (sku) => items.some((i) => i.sku === sku),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount: items.length,
      addItem,
      removeItem,
      toggleItem,
      isInWishlist,
    }),
    [items, addItem, removeItem, toggleItem, isInWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
