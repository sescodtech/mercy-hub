import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IProduct, IVariant, IColorVariant } from "@/types";

export interface CartItem {
  product: IProduct;
  variant?: IVariant;
  colorVariant?: IColorVariant;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: IProduct, quantity?: number, variant?: IVariant, colorVariant?: IColorVariant) => void;
  removeItem: (productId: string, variantId?: string, colorVariantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string, colorVariantId?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

function itemKey(productId: string, variantId?: string, colorVariantId?: string) {
  return `${productId}:${variantId ?? ""}:${colorVariantId ?? ""}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, quantity = 1, variant, colorVariant) => {
        set((state) => {
          const key = itemKey(product._id, variant?._id, colorVariant?._id);
          const existing = state.items.find(
            (i) =>
              itemKey(i.product._id, i.variant?._id, i.colorVariant?._id) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.product._id, i.variant?._id, i.colorVariant?._id) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { product, variant, colorVariant, quantity }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, variantId, colorVariantId) => {
        const key = itemKey(productId, variantId, colorVariantId);
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.product._id, i.variant?._id, i.colorVariant?._id) !== key
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId, colorVariantId) => {
        const key = itemKey(productId, variantId, colorVariantId);
        if (quantity <= 0) {
          get().removeItem(productId, variantId, colorVariantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.product._id, i.variant?._id, i.colorVariant?._id) === key
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => {
          const price =
            item.colorVariant?.priceOverride ??
            item.variant?.price ??
            item.product.price;
          return sum + price * item.quantity;
        }, 0),
    }),
    { name: "mercy-hub-cart" }
  )
);
