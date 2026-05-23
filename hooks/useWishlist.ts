import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { IProduct } from "@/types";

interface WishlistStore {
  items: IProduct[];
  addItem: (product: IProduct) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: IProduct) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          if (state.items.some((i) => i._id === product._id)) return state;
          return { items: [...state.items, product] };
        }),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i._id !== productId) })),

      toggleItem: (product) => {
        if (get().isWishlisted(product._id)) {
          get().removeItem(product._id);
        } else {
          get().addItem(product);
        }
      },

      isWishlisted: (productId) => get().items.some((i) => i._id === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "mercy-hub-wishlist",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
