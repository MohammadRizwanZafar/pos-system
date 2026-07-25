import { create } from "zustand";
import { getProductSellPrice } from "@/lib/utils";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  discount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product) => {
    const { items } = get();
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      set({
        items: items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { product, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const item = get().items.find((i) => i.product.id === productId);
    if (item && quantity > item.product.stock) return;
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    });
  },

  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

  clearCart: () => set({ items: [], discount: 0 }),

  getSubtotal: () =>
    get().items.reduce(
      (sum, i) => sum + getProductSellPrice(i.product) * i.quantity,
      0
    ),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
