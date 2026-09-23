import Constants from "expo-constants";
import {
  detectPriceChanges,
  formatPriceChangeMessage,
  type PriceChangeAlert,
} from "@musti/core";
import type { Product, ProductPriceSample } from "@musti/core";
import {
  ensureNotificationPermission,
  presentImmediateNotification,
} from "@musti/notifications";

const notificationsEnabled = Constants.appOwnership !== "expo";

type NotifyInput = {
  enabled: boolean;
  thresholdPct: number;
  products: Product[];
  existingSamples: ProductPriceSample[];
  newSamples: ProductPriceSample[];
  language?: "en" | "tr" | "nl";
  title: string;
};

export async function notifyPriceChanges(input: NotifyInput): Promise<PriceChangeAlert[]> {
  if (!input.enabled || !notificationsEnabled || input.newSamples.length === 0) {
    return [];
  }

  const alerts = detectPriceChanges({
    products: input.products,
    existingSamples: input.existingSamples,
    newSamples: input.newSamples,
    thresholdPct: input.thresholdPct,
  });

  if (alerts.length === 0) return alerts;

  const ok = await ensureNotificationPermission();
  if (!ok) return alerts;

  const locale =
    input.language === "en" || input.language === "nl" || input.language === "tr"
      ? input.language
      : "tr";
  const body =
    alerts.length === 1
      ? formatPriceChangeMessage(alerts[0], locale)
      : alerts
          .slice(0, 3)
          .map((a) => formatPriceChangeMessage(a, locale))
          .join("\n");

  await presentImmediateNotification({
    owner: "budget",
    title: input.title,
    body,
    payload: { v: 1, kind: "generic" },
  });

  return alerts;
}
