import type { NotificationPayload } from "@budget/notifications";

export type RouteTo =
  | string
  | { pathname: string; params?: Record<string, string> };

function isPayload(x: any): x is NotificationPayload {
  return x && typeof x === "object" && x.v === 1;
}

export function routeFromNotificationPayload(payloadRaw: any): RouteTo {
  const payload = isPayload(payloadRaw) ? payloadRaw : null;

  if (!payload) return "/(tabs)/bookshelf";

  if ("kind" in payload && payload.kind === "generic") {
    return "/(tabs)/bookshelf";
  }

  const link = (payload as any).link;
  if (!link || typeof link !== "object") return "/(tabs)/bookshelf";

  if (link.kind === "normal" && link.bookUri) {
    return {
      pathname: "/(tabs)/bookshelf/pdf-viewer",
      params: {
        uri: encodeURIComponent(link.bookUri),
        name: encodeURIComponent(link.bookName ?? "PDF"),
      },
    };
  }

  if (link.kind === "target" && link.targetId) {
    return {
      pathname: "/(tabs)/bookshelf/target/target-viewer",
      params: { targetId: String(link.targetId) },
    };
  }

  if (link.kind === "plan" && link.planId) {
    if (link.bookUri) {
      return {
        pathname: "/(tabs)/bookshelf/plan/plan-viewer",
        params: {
          planId: String(link.planId),
          uri: encodeURIComponent(link.bookUri),
          name: encodeURIComponent(link.bookName ?? "PDF"),
        },
      };
    }
    return "/(tabs)/bookshelf";
  }

  return "/(tabs)/bookshelf";
}
