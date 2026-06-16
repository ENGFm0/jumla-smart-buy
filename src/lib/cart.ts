import { useSyncExternalStore } from "react";

// سلة محلية (localStorage) — تجمع منتجات قبل إرسالها كطلبات عروض أسعار.
// لا تمسّ قاعدة البيانات؛ الإرسال يُنشئ طلبات (quote_requests) عادية.
export type CartItem = {
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  unit: string | null;
  quantity: number;
};

const KEY = "madad_cart";
const EMPTY: CartItem[] = [];
let items: CartItem[] = load();
const listeners = new Set<() => void>();

function load(): CartItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function persist() {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

function same(a: CartItem, productId: string, supplierId: string) {
  return a.productId === productId && a.supplierId === supplierId;
}

export function addToCart(item: CartItem) {
  const idx = items.findIndex((i) => same(i, item.productId, item.supplierId));
  if (idx >= 0) {
    items = items.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + item.quantity } : i));
  } else {
    items = [...items, item];
  }
  persist();
}

export function setQty(productId: string, supplierId: string, quantity: number) {
  items = items.map((i) => (same(i, productId, supplierId) ? { ...i, quantity } : i));
  persist();
}

export function removeFromCart(productId: string, supplierId: string) {
  items = items.filter((i) => !same(i, productId, supplierId));
  persist();
}

export function clearSupplier(supplierId: string) {
  items = items.filter((i) => i.supplierId !== supplierId);
  persist();
}

export function clearCart() {
  items = [];
  persist();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return items;
}
function getServerSnapshot() {
  return EMPTY;
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
