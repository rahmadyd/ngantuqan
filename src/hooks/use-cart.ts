"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

const STORAGE_KEY = "ngantuqan.cart";
const EMPTY: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): CartItem[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * Returns a referentially stable snapshot so useSyncExternalStore does not
 * loop. The cache is invalidated only when the stored string changes.
 */
function getSnapshot(): CartItem[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parse(raw);
  }
  return cachedItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function write(next: CartItem[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the cart lives in memory only for this session.
  }
  cachedRaw = JSON.stringify(next);
  cachedItems = next;
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback(
    (item: { productId: string; title: string; price: number }) => {
      const existing = items.find((entry) => entry.productId === item.productId);
      const next = existing
        ? items.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          )
        : [...items, { ...item, quantity: 1 }];
      write(next);
    },
    [items],
  );

  const removeItem = useCallback(
    (productId: string) => {
      write(items.filter((entry) => entry.productId !== productId));
    },
    [items],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const next =
        quantity <= 0
          ? items.filter((entry) => entry.productId !== productId)
          : items.map((entry) =>
              entry.productId === productId ? { ...entry, quantity } : entry,
            );
      write(next);
    },
    [items],
  );

  const clear = useCallback(() => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — nothing to remove.
    }
    write([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, addItem, removeItem, setQuantity, clear, total, count };
}
