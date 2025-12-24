import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationLinkKind = "generic" | "normal" | "plan" | "target";

type BudgetNotificationSettings = {
  enabled: boolean;
  hour: number;
  minute: number;

  /**
   * ✅ Where should the notification navigate on tap?
   * - generic: open bookshelf (or a default screen)
   * - normal: open a specific book
   * - plan: open a plan (and optionally a specific book inside that plan)
   * - target: open a target
   */
  linkKind: NotificationLinkKind;

  // normal
  bookUri?: string;
  bookName?: string;

  // plan
  planId?: string;
  planBookUri?: string;
  planBookName?: string;

  // target
  targetId?: string;

  setEnabled: (v: boolean) => void;
  setTime: (hour: number, minute: number) => void;

  /**
   * ✅ Convenience setters
   */
  setLinkGeneric: () => void;
  setLinkNormal: (bookUri: string, bookName?: string) => void;
  setLinkPlan: (
    planId: string,
    bookUri?: string,
    bookName?: string
  ) => void;
  setLinkTarget: (targetId: string) => void;

  /**
   * Optional: clear link data (keeps linkKind)
   */
  clearLinkData: () => void;
};

export const useBudgetNotificationSettingsStore =
  create<BudgetNotificationSettings>()(
    persist(
      (set, get) => ({
        enabled: false,
        hour: 9,
        minute: 0,

        // ✅ default: generic (safe)
        linkKind: "generic",

        // normal
        bookUri: undefined,
        bookName: undefined,

        // plan
        planId: undefined,
        planBookUri: undefined,
        planBookName: undefined,

        // target
        targetId: undefined,

        setEnabled: (enabled) => set({ enabled }),

        setTime: (hour, minute) => set({ hour, minute }),

        setLinkGeneric: () =>
          set({
            linkKind: "generic",
            bookUri: undefined,
            bookName: undefined,
            planId: undefined,
            planBookUri: undefined,
            planBookName: undefined,
            targetId: undefined,
          }),

        setLinkNormal: (bookUri, bookName) =>
          set({
            linkKind: "normal",
            bookUri,
            bookName,
            planId: undefined,
            planBookUri: undefined,
            planBookName: undefined,
            targetId: undefined,
          }),

        setLinkPlan: (planId, bookUri, bookName) =>
          set({
            linkKind: "plan",
            planId,
            planBookUri: bookUri,
            planBookName: bookName,
            bookUri: undefined,
            bookName: undefined,
            targetId: undefined,
          }),

        setLinkTarget: (targetId) =>
          set({
            linkKind: "target",
            targetId,
            bookUri: undefined,
            bookName: undefined,
            planId: undefined,
            planBookUri: undefined,
            planBookName: undefined,
          }),

        clearLinkData: () => {
          const kind = get().linkKind;
          if (kind === "normal") {
            set({ bookUri: undefined, bookName: undefined });
            return;
          }
          if (kind === "plan") {
            set({
              planId: undefined,
              planBookUri: undefined,
              planBookName: undefined,
            });
            return;
          }
          if (kind === "target") {
            set({ targetId: undefined });
            return;
          }
          // generic
          set({
            bookUri: undefined,
            bookName: undefined,
            planId: undefined,
            planBookUri: undefined,
            planBookName: undefined,
            targetId: undefined,
          });
        },
      }),
      {
        name: "budget-notification-settings",
        storage: createJSONStorage(() => AsyncStorage),

        /**
         * ✅ Optional but recommended: versioning + migrate for safety
         * Old stored shape: { enabled, hour, minute }
         */
        version: 1,
        migrate: (persisted: any) => {
          if (!persisted || typeof persisted !== "object") {
            return persisted;
          }

          // Back-compat defaults
          return {
            enabled: !!persisted.enabled,
            hour:
              typeof persisted.hour === "number" ? persisted.hour : 9,
            minute:
              typeof persisted.minute === "number" ? persisted.minute : 0,

            linkKind:
              typeof persisted.linkKind === "string"
                ? persisted.linkKind
                : "generic",

            bookUri: persisted.bookUri,
            bookName: persisted.bookName,

            planId: persisted.planId,
            planBookUri: persisted.planBookUri,
            planBookName: persisted.planBookName,

            targetId: persisted.targetId,
          } as Partial<BudgetNotificationSettings>;
        },
      }
    )
  );
