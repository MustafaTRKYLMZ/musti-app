import type { NotificationPayload } from "@musti/notifications";

export type NotificationLinkSettings = {
  linkKind?: "generic" | "normal" | "plan" | "target";

  // normal
  bookUri?: string;
  bookName?: string;

  // plan
  planId?: string;
  planBookUri?: string;
  planBookName?: string;

  // target
  targetId?: string;
};

export default function buildPayloadFromNotificationSettings(
  s: NotificationLinkSettings
): NotificationPayload {
  const kind = s?.linkKind ?? "generic";

  if (kind === "normal") {
    if (typeof s.bookUri === "string" && s.bookUri.length > 0) {
      return {
        v: 1,
        link: {
          kind: "normal",
          bookUri: s.bookUri,
          bookName: s.bookName,
        },
      };
    }
    return { v: 1, kind: "generic" };
  }

  if (kind === "plan") {
    if (typeof s.planId === "string" && s.planId.length > 0) {
      return {
        v: 1,
        link: {
          kind: "plan",
          planId: s.planId,
          bookUri: s.planBookUri,
          bookName: s.planBookName,
        },
      };
    }
    return { v: 1, kind: "generic" };
  }

  if (kind === "target") {
    if (typeof s.targetId === "string" && s.targetId.length > 0) {
      return {
        v: 1,
        link: {
          kind: "target",
          targetId: s.targetId,
        },
      };
    }
    return { v: 1, kind: "generic" };
  }

  return { v: 1, kind: "generic" };
}
