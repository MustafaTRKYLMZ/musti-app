// app/utils/buildPayloadFromReminder.ts
import type { NotificationPayload } from "@budget/notifications";
import type { ReminderItem } from "@/store/reminders/types";


type PlanLike = {
  id: string;
  title?: string;
  items: Array<{ bookUri: string; bookName: string }>;
  perBook?: Record<
    string,
    {
      bookUri: string;
      currentPageInBook?: number;
      pagesReadToday?: number;
      bookTotalPages?: number;
    }
  >;
};


function pickPlanBook(plan: PlanLike) {
  if (!plan?.items?.length) return null;
  const first = plan.items[0];
  if (!first?.bookUri) return null;
  return { bookUri: first.bookUri, bookName: first.bookName ?? "PDF" };
}

export function buildPayloadFromReminder(
  rem: ReminderItem,
  ctx: {
    plans: PlanLike[];
    booksMap?: Record<string, any>;
  }
): NotificationPayload {
  const t = rem.target;

  // BOOK
  if (t.type === "book") {
    // İsteğe bağlı guard: store’da yoksa generic’e düş
    if (ctx.booksMap && !ctx.booksMap[t.bookUri]) {
      return { v: 1, kind: "generic" };
    }

    return {
      v: 1,
      link: { kind: "normal", bookUri: t.bookUri, bookName: t.bookName },
    };
  }

  // TARGET
  if (t.type === "target") {
    return { v: 1, link: { kind: "target", targetId: t.targetId } };
  }

  // PLAN  ✅ kritik kısım: planId + (plan içinden bookUri/bookName)
  if (t.type === "plan") {
    const plan = (ctx.plans ?? []).find(
      (p) => String(p.id) === String(t.planId)
    );

    if (!plan) return { v: 1, kind: "generic" };

    const chosen = pickPlanBook(plan);
    if (!chosen) return { v: 1, kind: "generic" };

    return {
      v: 1,
      link: {
        kind: "plan",
        planId: String(t.planId),
        bookUri: chosen.bookUri,
        bookName: chosen.bookName,
      },
    };
  }

  // general / weeklyReport
  return { v: 1, kind: "generic" };
}
