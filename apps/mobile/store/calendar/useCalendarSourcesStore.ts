import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CalendarFeed,
  GoogleAccount,
  LOCAL_CALENDAR_ID,
  createLocalCalendarFeed,
  getWritableCalendarFeeds,
  isWritableCalendarFeed,
} from "@musti/planner";
import { revokeAndDeleteGoogleTokens } from "@/services/googleCalendar/accessToken";
import { useCalendarEventsStore } from "./useCalendarEventsStore";

const uid = () => `acct_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const feedUid = () => `feed_${Date.now()}_${Math.random().toString(16).slice(2)}`;

type State = {
  accounts: GoogleAccount[];
  feeds: CalendarFeed[];
  defaultWriteCalendarId: string;
  hasHydrated: boolean;
  lastGlobalSyncAt?: string;

  getEnabledFeedIds: () => Set<string>;
  getWritableFeeds: () => CalendarFeed[];
  resolveDefaultWriteCalendarId: () => string;
  setDefaultWriteCalendarId: (feedId: string) => void;
  toggleFeed: (feedId: string) => void;
  enableFeed: (feedId: string) => void;

  addGoogleAccount: (account: GoogleAccount, googleFeeds: CalendarFeed[]) => void;
  mergeGoogleFeedsForAccount: (
    account: GoogleAccount,
    items: Array<{
      id: string;
      summary?: string;
      backgroundColor?: string;
      primary?: boolean;
      accessRole?: string;
    }>
  ) => void;
  removeGoogleAccount: (accountId: string) => void;
  markFeedSynced: (feedId: string) => void;
  setLastGlobalSyncAt: (iso: string) => void;
};

function normalizeDefaultWriteCalendarId(
  feeds: CalendarFeed[],
  preferred?: string
): string {
  const writable = getWritableCalendarFeeds(feeds);
  if (
    preferred &&
    writable.some((f) => f.id === preferred)
  ) {
    return preferred;
  }
  const primary = writable.find((f) => f.isPrimary && f.provider === "google");
  if (primary) return primary.id;
  return LOCAL_CALENDAR_ID;
}

function ensureLocalFeed(feeds: CalendarFeed[]): CalendarFeed[] {
  if (feeds.some((f) => f.id === LOCAL_CALENDAR_ID)) {
    return feeds;
  }
  return [createLocalCalendarFeed(), ...feeds];
}

export const useCalendarSourcesStore = create<State>()(
  persist(
    (set, get) => ({
      accounts: [],
      feeds: [createLocalCalendarFeed()],
      defaultWriteCalendarId: LOCAL_CALENDAR_ID,
      hasHydrated: false,
      lastGlobalSyncAt: undefined,

      getWritableFeeds: () => getWritableCalendarFeeds(get().feeds),

      resolveDefaultWriteCalendarId: () =>
        normalizeDefaultWriteCalendarId(
          get().feeds,
          get().defaultWriteCalendarId
        ),

      setDefaultWriteCalendarId: (feedId) => {
        const feed = get().feeds.find((f) => f.id === feedId);
        if (!feed || !isWritableCalendarFeed(feed)) return;
        set({ defaultWriteCalendarId: feedId });
      },

      getEnabledFeedIds: () => {
        const enabled = get()
          .feeds.filter((f) => f.enabled || f.isPrimary)
          .map((f) => f.id);
        return new Set(enabled);
      },

      toggleFeed: (feedId) => {
        if (feedId === LOCAL_CALENDAR_ID) return;
        const feed = get().feeds.find((f) => f.id === feedId);
        if (feed?.isPrimary) return;
        set((s) => ({
          feeds: s.feeds.map((f) =>
            f.id === feedId ? { ...f, enabled: !f.enabled } : f
          ),
        }));
      },

      enableFeed: (feedId) => {
        set((s) => ({
          feeds: s.feeds.map((f) =>
            f.id === feedId ? { ...f, enabled: true } : f
          ),
        }));
      },

      mergeGoogleFeedsForAccount: (account, items) =>
        set((s) => {
          const existing = s.feeds.filter(
            (f) => f.accountId === account.id && f.provider === "google"
          );
          const byExternal = new Map(
            existing.map((f) => [f.externalCalendarId, f])
          );

          const mergedGoogle = items.map((item) => {
            const prev = byExternal.get(item.id);
            const isPrimary = Boolean(item.primary);
            if (prev) {
              return {
                ...prev,
                name: item.summary?.trim() || prev.name,
                color: item.backgroundColor ?? prev.color,
                isPrimary,
                accessRole: item.accessRole ?? prev.accessRole,
                enabled: isPrimary ? true : prev.enabled,
              };
            }
            return {
              id: feedUid(),
              accountId: account.id,
              provider: "google" as const,
              externalCalendarId: item.id,
              name: item.summary?.trim() || "Untitled calendar",
              color: item.backgroundColor,
              enabled: true,
              isPrimary,
              accessRole: item.accessRole,
            };
          });

          const otherFeeds = s.feeds.filter(
            (f) => f.accountId !== account.id || f.provider !== "google"
          );
          const nextFeeds = ensureLocalFeed([...otherFeeds, ...mergedGoogle]);

          return {
            feeds: nextFeeds,
            defaultWriteCalendarId: normalizeDefaultWriteCalendarId(
              nextFeeds,
              s.defaultWriteCalendarId
            ),
          };
        }),

      addGoogleAccount: (account, googleFeeds) =>
        set((s) => {
          const staleAccountIds = s.accounts
            .filter(
              (a) => a.email.toLowerCase() === account.email.toLowerCase()
            )
            .map((a) => a.id);

          for (const staleId of staleAccountIds) {
            void revokeAndDeleteGoogleTokens(staleId);
            useCalendarEventsStore.getState().removeEventsForAccount(staleId);
          }

          const withoutDupEmail = s.accounts.filter(
            (a) => a.email.toLowerCase() !== account.email.toLowerCase()
          );
          const withoutOldFeeds = s.feeds.filter(
            (f) =>
              f.provider !== "google" ||
              !staleAccountIds.includes(f.accountId)
          );

          const nextFeeds = ensureLocalFeed([...withoutOldFeeds, ...googleFeeds]);
          const nextDefault =
            s.defaultWriteCalendarId === LOCAL_CALENDAR_ID
              ? normalizeDefaultWriteCalendarId(nextFeeds)
              : normalizeDefaultWriteCalendarId(
                  nextFeeds,
                  s.defaultWriteCalendarId
                );

          return {
            accounts: [...withoutDupEmail, account],
            feeds: nextFeeds,
            defaultWriteCalendarId: nextDefault,
          };
        }),

      removeGoogleAccount: (accountId) => {
        void revokeAndDeleteGoogleTokens(accountId);
        useCalendarEventsStore.getState().removeEventsForAccount(accountId);
        set((s) => {
          const nextFeeds = ensureLocalFeed(
            s.feeds.filter((f) => f.accountId !== accountId)
          );
          return {
            accounts: s.accounts.filter((a) => a.id !== accountId),
            feeds: nextFeeds,
            defaultWriteCalendarId: normalizeDefaultWriteCalendarId(
              nextFeeds,
              s.defaultWriteCalendarId
            ),
          };
        });
      },

      markFeedSynced: (feedId) =>
        set((s) => ({
          feeds: s.feeds.map((f) =>
            f.id === feedId
              ? { ...f, lastSyncedAt: new Date().toISOString() }
              : f
          ),
        })),

      setLastGlobalSyncAt: (iso) => set({ lastGlobalSyncAt: iso }),
    }),
    {
      name: "calendar-sources",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        feeds: state.feeds,
        defaultWriteCalendarId: state.defaultWriteCalendarId,
        lastGlobalSyncAt: state.lastGlobalSyncAt,
      }),
      onRehydrateStorage: () => (state, err) => {
        if (err || !state) return;
        state.feeds = ensureLocalFeed(state.feeds);

        if (state.accounts.length > 0) {
          const googleFeeds = state.feeds.filter((f) => f.provider === "google");
          if (googleFeeds.length > 0 && !googleFeeds.some((f) => f.enabled)) {
            state.feeds = state.feeds.map((f) =>
              f.provider === "google" ? { ...f, enabled: true } : f
            );
          }
        }

        state.feeds = state.feeds.map((f) =>
          f.isPrimary ? { ...f, enabled: true } : f
        );

        state.defaultWriteCalendarId = normalizeDefaultWriteCalendarId(
          state.feeds,
          state.defaultWriteCalendarId
        );

        useCalendarSourcesStore.setState({ hasHydrated: true });
      },
    }
  )
);

export function buildGoogleAccount(email: string, displayName?: string): GoogleAccount {
  return {
    id: uid(),
    provider: "google",
    email,
    displayName,
    connectedAt: new Date().toISOString(),
  };
}

export function buildGoogleFeeds(
  account: GoogleAccount,
  items: Array<{
    id: string;
    summary?: string;
    backgroundColor?: string;
    primary?: boolean;
    accessRole?: string;
  }>
): CalendarFeed[] {
  return items.map((item) => ({
    id: feedUid(),
    accountId: account.id,
    provider: "google",
    externalCalendarId: item.id,
    name: item.summary?.trim() || "Untitled calendar",
    color: item.backgroundColor,
    enabled: true,
    isPrimary: Boolean(item.primary),
    accessRole: item.accessRole,
  }));
}
