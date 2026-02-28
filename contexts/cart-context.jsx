"use client";

import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";

const CART_STORAGE_KEY = "wknd-cart";

const defaultCartItem = {
  id: "",
  sku: "",
  name: "",
  price: { value: 0, currency: "USD" },
  quantity: 1,
  size: null,
  color: null,
  imageUrl: null,
};

function makeCartId(sku, size, color) {
  return [sku, size ?? "", color ?? ""].filter(Boolean).join("::");
}

function parseCartItem(item) {
  return {
    id: item.id ?? makeCartId(item.sku, item.size, item.color),
    sku: item.sku ?? "",
    name: item.name ?? "",
    price: item.price ?? defaultCartItem.price,
    quantity: Math.max(1, Number(item.quantity) || 1),
    size: item.size ?? null,
    color: item.color ?? null,
    imageUrl: item.imageUrl ?? null,
  };
}

function loadCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(parseCartItem) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(items);
  }, [mounted, items]);

  const addItem = useCallback((product, options = {}) => {
    const { quantity = 1, size = null, color = null, skuOverride = null } = options;
    const sku = skuOverride ?? (typeof product === "object" ? product.sku : product) ?? "";
    const name = typeof product === "object" ? product.name ?? "" : "";
    const price = typeof product === "object" && product.price?.final
      ? product.price.final.amount
      : typeof product === "object" && product.price
        ? product.price
        : { value: 0, currency: "USD" };
    const imageUrl = typeof product === "object" && product.images?.[0]?.url
      ? product.images[0].url
      : null;
    const id = makeCartId(sku, size, color);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        parseCartItem({
          id,
          sku,
          name,
          price,
          quantity,
          size,
          color,
          imageUrl,
        }),
      ];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      addItem,
      removeItem,
      updateQuantity,
    }),
    [items, addItem, removeItem, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
