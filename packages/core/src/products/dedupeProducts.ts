import type { Product } from "../types/product";
import { productNamesMatch } from "./normalizeProductName";

/** Merge products with equivalent names (OCR / spelling variants). */
export function dedupeProducts<T extends Product>(products: T[]): T[] {
  const result: T[] = [];

  for (const product of products) {
    const index = result.findIndex((entry) =>
      productNamesMatch(entry.name, product.name)
    );
    if (index < 0) {
      result.push(product);
      continue;
    }

    const kept = result[index];
    result[index] = {
      ...kept,
      ...product,
      id: kept.id,
      name: product.name.trim().length >= kept.name.trim().length
        ? product.name.trim()
        : kept.name,
      category: kept.category ?? product.category,
    };
  }

  return result;
}
