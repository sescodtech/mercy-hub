import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { IProduct, IVariant, ICartItem } from "@/types";

interface CartStore {
  items: ICartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: IProduct, quantity?: number, variant?: IVariant) => void;
  removeItem: (productId: string, variantValue?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantValue?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getItem: (productId: string, variantValue?: string) => ICartItem | undefined;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, variant) => {
        set((state) => {
          const key = variant ? `${product._id}-${variant.value}` : product._id;
          const existing = state.items.find((i) => {
            const iKey = i.variant ? `${i.product._id}-${i.variant.value}` : i.product._id;
            return iKey === key;
          });

          if (existing) {
            return {
              items: state.items.map((i) => {
                const iKey = i.variant ? `${i.product._id}-${i.variant.value}` : i.product._id;
                if (iKey === key) {
                  return { ...i, quantity: i.quantity + quantity };
                }
                return i;
              }),
            };
          }

          return { items: [...state.items, { product, variant, quantity }] };
        });
      },

      removeItem: (productId, variantValue) => {
        set((state) => ({
          items: state.items.filter((i) => {
            if (variantValue) {
              return !(i.product._id === productId && i.variant?.value === variantValue);
            }
            return i.product._id !== productId;
          }),
        }));
      },

      updateQuantity: (productId, quantity, variantValue) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantValue);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            const matches = variantValue
              ? i.product._id === productId && i.variant?.value === variantValue
              : i.product._id === productId;
            return matches ? { ...i, quantity } : i;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => {
          const price = i.variant?.price ?? i.product.price;
          return sum + price * i.quantity;
        }, 0),

      getItem: (productId, variantValue) =>
        get().items.find((i) => {
          if (variantValue) {
            return i.product._id === productId && i.variant?.value === variantValue;
          }
          return i.product._id === productId;
        }),
    }),
    {
      name: "mercy-hub-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
