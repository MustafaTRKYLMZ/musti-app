import React, { useMemo } from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import Toast from "react-native-root-toast";

import { ensureNotificationPermission } from "@budget/notifications";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";

import { NotificationReminderSection } from "./NotificationReminderSection";
import { useBookshelfNotificationSettingsStore } from "@/store/bookshelf/useNotificationSettingsStore";

import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";
import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";

import {
  fireTestNotificationGeneric,
  fireTestLinkBook,
  fireTestLinkPlan,
  fireTestLinkTarget,
  fireTestLinkReminders,
} from "@/utils/debugNotifications";

export function BookshelfNotificationsSection() {
  const { colors } = useTheme();

  const enabled = useBookshelfNotificationSettingsStore((s) => s.enabled);
  const hour = useBookshelfNotificationSettingsStore((s) => s.hour);
  const minute = useBookshelfNotificationSettingsStore((s) => s.minute);
  const setEnabled = useBookshelfNotificationSettingsStore((s) => s.setEnabled);
  const setTime = useBookshelfNotificationSettingsStore((s) => s.setTime);

  const booksMap = useBooksStore((s) => s.items);
  const plans = useReadingPlanStore((s) => s.plans);
  const targets = useReadingTargetsStore((s) => s.targets);

  const firstBook = useMemo(() => {
    const entries = Object.entries(booksMap ?? {});
    if (!entries.length) return null;

    entries.sort((a, b) => {
      const ap = Number((a[1] as any)?.lastPage ?? 0);
      const bp = Number((b[1] as any)?.lastPage ?? 0);
      return bp - ap;
    });

    const [uri, b] = entries[0];
    const name = (b as any)?.name ?? "PDF";
    return { uri, name };
  }, [booksMap]);

  const firstPlan = useMemo(() => {
    return (plans ?? []).length ? (plans ?? [])[0] : null;
  }, [plans]);

  const firstTarget = useMemo(() => {
    const arr = targets ?? [];
    if (!arr.length) return null;
    return arr.find((t) => t.status === "active") ?? arr[0];
  }, [targets]);

  // ✅ plan içinden gerçekten var olan kitabı seç
  const firstPlanBook = useMemo(() => {
    const p: any = firstPlan;
    const it = p?.items?.[0];
    if (!it?.bookUri) return null;
    return {
      bookUri: String(it.bookUri),
      bookName: String(it.bookName ?? "PDF"),
    };
  }, [firstPlan]);

  const requirePerm = async () => {
    const ok = await ensureNotificationPermission();
    if (!ok) {
      Toast.show("Notifications permission is required.", {
        duration: Toast.durations.SHORT,
      });
    }
    return ok;
  };

  const btnStyle = ({ pressed }: { pressed: boolean }) => [
    styles.debugBtn,
    {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.borderSubtle,
      opacity: pressed ? 0.85 : 1,
    },
  ];

  const btnText = { color: colors.textPrimary, fontWeight: "900" as const };

  return (
    <View>
      <NotificationReminderSection
        title="Reading reminder"
        description="Get a daily notification at your chosen time."
        enabled={enabled}
        hour={hour}
        minute={minute}
        onToggle={async (v) => {
          if (v) {
            const ok = await requirePerm();
            if (!ok) {
              setEnabled(false);
              return;
            }
            setEnabled(true);
            return;
          }
          setEnabled(false);
        }}
        onTimeChange={async (h, m) => {
          setTime(h, m);
        }}
      />

      <View style={{ height: spacing.lg }} />
      {/* test area (only for development) */}
      {process.env.NODE_ENV === "development" && (
        <>
          <MText variant="heading3" style={{ color: colors.textPrimary }}>
            Debug
          </MText>
          <View style={{ height: spacing.sm }} />
          <MText style={{ color: colors.textSecondary }}>
            These schedule a notification in 5 seconds. Tap it to test routing.
          </MText>

          <View style={{ height: spacing.md }} />

          <Pressable
            onPress={async () => {
              const ok = await requirePerm();
              if (!ok) return;
              await fireTestNotificationGeneric();
              Toast.show("Generic test scheduled (5s).", {
                duration: Toast.durations.SHORT,
              });
            }}
            style={btnStyle}
          >
            <MText style={btnText}>Test: Generic (5s)</MText>
          </Pressable>

          <View style={{ height: spacing.sm }} />

          <Pressable
            onPress={async () => {
              const ok = await requirePerm();
              if (!ok) return;

              await fireTestLinkReminders("bookshelf");
              Toast.show("Reminders link test scheduled (5s).", {
                duration: Toast.durations.SHORT,
              });
            }}
            style={btnStyle}
          >
            <MText style={btnText}>Test link: Reminders (5s)</MText>
          </Pressable>

          <View style={{ height: spacing.sm }} />

          <Pressable
            onPress={async () => {
              const ok = await requirePerm();
              if (!ok) return;

              if (!firstBook) {
                Toast.show("No book found (Books store empty).", {
                  duration: Toast.durations.SHORT,
                });
                return;
              }

              await fireTestLinkBook(firstBook.uri, firstBook.name);
              Toast.show("Book link test scheduled (5s).", {
                duration: Toast.durations.SHORT,
              });
            }}
            style={btnStyle}
          >
            <MText style={btnText}>
              Test link: Book (5s)
              {firstBook ? ` — ${firstBook.name}` : ""}
            </MText>
          </Pressable>

          <View style={{ height: spacing.sm }} />

          <Pressable
            onPress={async () => {
              const ok = await requirePerm();
              if (!ok) return;

              if (!firstPlan) {
                Toast.show("No plan found (Plans store empty).", {
                  duration: Toast.durations.SHORT,
                });
                return;
              }

              if (!firstPlanBook) {
                Toast.show("Plan has no books (plan.items empty).", {
                  duration: Toast.durations.SHORT,
                });
                return;
              }

              await fireTestLinkPlan(
                String((firstPlan as any).id),
                firstPlanBook.bookUri,
                firstPlanBook.bookName
              );

              Toast.show("Plan link test scheduled (5s).", {
                duration: Toast.durations.SHORT,
              });
            }}
            style={btnStyle}
          >
            <MText style={btnText}>
              Test link: Plan (5s)
              {firstPlan ? ` — ${(firstPlan as any)?.title ?? "Plan"}` : ""}
            </MText>
          </Pressable>

          <View style={{ height: spacing.sm }} />

          <Pressable
            onPress={async () => {
              const ok = await requirePerm();
              if (!ok) return;

              if (!firstTarget) {
                Toast.show("No target found (Targets store empty).", {
                  duration: Toast.durations.SHORT,
                });
                return;
              }

              await fireTestLinkTarget(String((firstTarget as any).id));
              Toast.show("Target link test scheduled (5s).", {
                duration: Toast.durations.SHORT,
              });
            }}
            style={btnStyle}
          >
            <MText style={btnText}>
              Test link: Target (5s)
              {firstTarget
                ? ` — ${(firstTarget as any)?.title ?? "Target"}`
                : ""}
            </MText>
          </Pressable>
        </>
      )}
      {/* */}
      <View style={{ height: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  debugBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
});
