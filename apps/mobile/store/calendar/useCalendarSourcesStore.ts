import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CalendarFeed,
  GoogleAccount,
  LOCAL_CALENDAR_ID,
  createLocalCalendarFeed,
} from "@musti/planner";
import { deleteGoogleTokens } from "@/services/googleCalendar/tokenStorage";
import { useCalendarEventsStore } from "./useCalendarEventsStore";

const uid = () => `acct_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const feedUid = () => `feed_${Date.now()}_${Math.random().toString(16).slice(2)}`;

type State = {
  accounts: GoogleAccount[];
  feeds: CalendarFeed[];
  hasHydrated: boolean;
  lastGlobalSyncAt?: string;

  getEnabledFeedIds: () => Set<string>;
  toggleFeed: (feedId: string) => void;

  addGoogleAccount: (account: GoogleAccount, googleFeeds: CalendarFeed[]) => void;
  removeGoogleAccount: (accountId: string) => void;
  markFeedSynced: (feedId: string) => void;
  setLastGlobalSyncAt: (iso: string) => void;
};

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
      hasHydrated: false,
      lastGlobalSyncAt: undefined,

      getEnabledFeedIds: () => {
        const enabled = get()
          .feeds.filter((f) => f.enabled)
          .map((f) => f.id);
        return new Set(enabled);
      },

      toggleFeed: (feedId) => {
        if (feedId === LOCAL_CALENDAR_ID) return;
        set((s) => ({
          feeds: s.feeds.map((f) =>
            f.id === feedId ? { ...f, enabled: !f.enabled } : f
          ),
        }));
      },

      addGoogleAccount: (account, googleFeeds) =>
        set((s) => {
          const withoutDupEmail = s.accounts.filter(
            (a) => a.email.toLowerCase() !== account.email.toLowerCase()
          );
          const withoutOldFeeds = s.feeds.filter(
            (f) => f.accountId !== account.id
          );

          return {
            accounts: [...withoutDupEmail, account],
            feeds: ensureLocalFeed([...withoutOldFeeds, ...googleFeeds]),
          };
        }),

      removeGoogleAccount: (accountId) => {
        void deleteGoogleTokens(accountId);
        useCalendarEventsStore.getState().removeEventsForAccount(accountId);
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== accountId),
          feeds: ensureLocalFeed(
            s.feeds.filter((f) => f.accountId !== accountId)
          ),
        }));
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
        lastGlobalSyncAt: state.lastGlobalSyncAt,
      }),
      onRehydrateStorage: () => (state, err) => {
        if (err || !state) return;
        state.feeds = ensureLocalFeed(state.feeds);
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
  }>
): CalendarFeed[] {
  return items.map((item) => ({
    id: feedUid(),
    accountId: account.id,
    provider: "google",
    externalCalendarId: item.id,
    name: item.summary?.trim() || "Untitled calendar",
    color: item.backgroundColor,
    enabled: Boolean(item.primary),
    isPrimary: Boolean(item.primary),
  }));
}
