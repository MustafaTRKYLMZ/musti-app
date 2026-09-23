import type { NotificationPayload } from "@musti/notifications";
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";

export type RouteTo =
  | string
  | { pathname: string; params?: Record<string, string> };

function isPayload(x: any): x is NotificationPayload {
  return x && typeof x === "object" && x.v === 1;
}

function pickNextBookInPlan(plan: any) {
  const items = plan?.items ?? [];
  const perBook = plan?.perBook ?? {};

  if (!items.length) return null;

  for (const it of items) {
    const bookUri = it?.bookUri;
    if (!bookUri) continue;

    const target = Number(it?.pagesPerDay ?? 0);
    const readToday = Number(perBook?.[bookUri]?.pagesReadToday ?? 0);

    if (target > 0 && readToday < target) {
      return { bookUri, bookName: it?.bookName ?? "PDF" };
    }
  }

  const first = items[0];
  if (first?.bookUri) return { bookUri: first.bookUri, bookName: first.bookName ?? "PDF" };

  return null;
}

export function routeFromNotificationPayload(payloadRaw: any): RouteTo {
  const payload = isPayload(payloadRaw) ? payloadRaw : null;
  if (!payload) return "/(tabs)/bookshelf";

  if ("kind" in payload && payload.kind === "generic") {
    return "/(tabs)/bookshelf";
  }

  const link = (payload as any).link;
  if (!link || typeof link !== "object") return "/(tabs)/bookshelf";

  // ✅ Book
  if (link.kind === "normal" && link.bookUri) {
    return {
      pathname: "/(tabs)/bookshelf/pdf/viewer",
      params: {
        uri: encodeURIComponent(String(link.bookUri)),
        name: encodeURIComponent(String(link.bookName ?? "PDF")),
      },
    };
  }

  // ✅ Target
  if (link.kind === "target" && link.targetId) {
    return {
      pathname: "/(tabs)/bookshelf/target/target-viewer",
      params: { targetId: String(link.targetId) },
    };
  }

  // ✅ Plan (dynamic book choose)
  if (link.kind === "plan" && link.planId) {
    const plans = useReadingPlanStore.getState().plans ?? [];
    const plan = plans.find((p: any) => String(p.id) === String(link.planId));

    if (!plan) return "/(tabs)/bookshelf";

    const nextBook = pickNextBookInPlan(plan);
    if (!nextBook?.bookUri) return "/(tabs)/bookshelf";

    return {
      pathname: "/(tabs)/bookshelf/plan/plan-viewer",
      params: {
        planId: String(link.planId),
        uri: encodeURIComponent(String(nextBook.bookUri)),
        name: encodeURIComponent(String(nextBook.bookName ?? "PDF")),
      },
    };
  }

  return "/(tabs)/bookshelf";
}
