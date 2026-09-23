import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, ProductPriceSample, ReceiptLineDraft } from "@musti/core";
import { dedupeProducts, productNamesMatch } from "@musti/core";
import { getZustandStorage } from "@/utils/storage/zustandStorage";
import { createId } from "@/utils/id";

const STORAGE_KEY = "products_v1";

export type ProductWithMeta = Product & {
  lastPrice?: number;
  lastCurrency?: string;
  lastStoreId?: string;
  lastStoreName?: string;
  lastPurchasedAt?: string;
};

type RecordPurchaseInput = {
  lines: ReceiptLineDraft[];
  storeId: string;
  storeName: string;
  date: string;
  currency: string;
  category?: string;
};

type ProductsState = {
  products: ProductWithMeta[];
  priceSamples: ProductPriceSample[];
  isHydrated: boolean;
  loadFromStorage: () => Promise<void>;
  findByName: (name: string) => ProductWithMeta | undefined;
  resolveOrCreate: (name: string, category?: string) => {
    product: ProductWithMeta;
    isNew: boolean;
  };
  recordPurchase: (input: RecordPurchaseInput) => {
    enrichedLines: ReceiptLineDraft[];
    newSamples: ProductPriceSample[];
  };
};

export const useProductsStore = create(
  persist<ProductsState>(
    (set, get) => ({
      products: [],
      priceSamples: [],
      isHydrated: false,

      async loadFromStorage() {
        if (!get().isHydrated) {
          set({ isHydrated: true });
        }
      },

      findByName(name) {
        return get().products.find((p) => productNamesMatch(p.name, name));
      },

      resolveOrCreate(name, category) {
        const trimmed = name.trim();
        const existing = get().findByName(trimmed);
        if (existing) {
          return { product: existing, isNew: false };
        }

        const product: ProductWithMeta = {
          id: createId("product"),
          name: trimmed,
          category,
        };

        return { product, isNew: true };
      },

      recordPurchase(input) {
        const state = get();
        const nextProducts = [...state.products];
        const nextSamples = [...state.priceSamples];
        const enrichedLines: ReceiptLineDraft[] = [];
        const newSamples: ProductPriceSample[] = [];

        for (const line of input.lines) {
          const trimmed = line.name.trim();
          if (!trimmed) continue;

          let index = nextProducts.findIndex((p) =>
            productNamesMatch(p.name, trimmed)
          );

          if (index < 0) {
            nextProducts.push({
              id: createId("product"),
              name: trimmed,
              category: line.productCategory ?? input.category,
              defaultUnit: line.unit,
              defaultStandardUnit: line.unit,
            });
            index = nextProducts.length - 1;
          }

          const unitPrice =
            line.unitPrice ??
            (line.totalAmount && line.quantity
              ? line.totalAmount / line.quantity
              : line.totalAmount);

          const current = nextProducts[index];
          const updated: ProductWithMeta = {
            ...current,
            category: current.category ?? line.productCategory ?? input.category,
            defaultUnit: line.unit ?? current.defaultUnit,
            defaultStandardUnit: line.unit ?? current.defaultStandardUnit,
            lastPrice: unitPrice ?? current.lastPrice,
            lastCurrency: input.currency,
            lastStoreId: input.storeId,
            lastStoreName: input.storeName,
            lastPurchasedAt: input.date,
          };

          nextProducts[index] = updated;

          if (unitPrice != null && unitPrice > 0) {
            const sample: ProductPriceSample = {
              productId: updated.id,
              date: input.date,
              unitPrice,
              currency: input.currency,
              storeId: input.storeId,
              storeName: input.storeName,
            };
            nextSamples.push(sample);
            newSamples.push(sample);
          }

          enrichedLines.push({
            ...line,
            productId: updated.id,
          });
        }

        set({
          products: nextProducts,
          priceSamples: nextSamples.slice(-2000),
        });

        return { enrichedLines, newSamples };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getZustandStorage()),
      onRehydrateStorage: () => (state) => {
        if (state?.products?.length) {
          useProductsStore.setState({
            products: dedupeProducts(state.products),
            isHydrated: true,
          });
          return;
        }
        useProductsStore.setState({ isHydrated: true });
      },
    }
  )
);
