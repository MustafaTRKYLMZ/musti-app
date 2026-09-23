import type { Product, ProductPriceSample } from "../types/product";

export type PriceChangeAlert = {
  productId: string;
  productName: string;
  storeName?: string;
  previousPrice: number;
  newPrice: number;
  changePct: number;
  currency?: string;
};

type DetectInput = {
  products: Product[];
  existingSamples: ProductPriceSample[];
  newSamples: ProductPriceSample[];
  thresholdPct?: number;
};

function findPreviousSample(
  existingSamples: ProductPriceSample[],
  sample: ProductPriceSample
): ProductPriceSample | null {
  const sameStore = existingSamples
    .filter(
      (s) =>
        s.productId === sample.productId &&
        s.date <= sample.date &&
        !(s.date === sample.date && s.unitPrice === sample.unitPrice) &&
        (sample.storeId ? s.storeId === sample.storeId : true)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return sameStore[0] ?? null;
}

export function detectPriceChanges(input: DetectInput): PriceChangeAlert[] {
  const thresholdPct = input.thresholdPct ?? 5;
  const productById = new Map(input.products.map((p) => [p.id, p]));
  const alerts: PriceChangeAlert[] = [];

  for (const sample of input.newSamples) {
    const previous = findPreviousSample(input.existingSamples, sample);
    if (!previous || previous.unitPrice <= 0) continue;

    const changePct =
      ((sample.unitPrice - previous.unitPrice) / previous.unitPrice) * 100;

    if (Math.abs(changePct) < thresholdPct) continue;

    const product = productById.get(sample.productId);
    if (!product) continue;

    alerts.push({
      productId: sample.productId,
      productName: product.name,
      storeName: sample.storeName,
      previousPrice: previous.unitPrice,
      newPrice: sample.unitPrice,
      changePct,
      currency: sample.currency,
    });
  }

  return alerts.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}

export function formatPriceChangeMessage(
  alert: PriceChangeAlert,
  locale: "en" | "tr" | "nl" = "tr"
): string {
  const pct = Math.abs(alert.changePct).toFixed(0);
  const direction =
    alert.changePct > 0
      ? locale === "tr"
        ? "pahalandı"
        : locale === "nl"
          ? "stijgt"
          : "increased"
      : locale === "tr"
        ? "ucuzladı"
        : locale === "nl"
          ? "daalt"
          : "decreased";

  const store = alert.storeName ? ` (${alert.storeName})` : "";
  return `${alert.productName}${store}: %${pct} ${direction}`;
}
