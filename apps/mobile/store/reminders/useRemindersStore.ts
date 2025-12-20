import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReminderItem, ReminderOwner, ReminderSchedule, ReminderTarget } from "./types";

type CreateReminderInput = {
  owner: ReminderOwner;
  title: string;
  body: string;
  enabled?: boolean;
  target?: ReminderTarget;
  schedule: ReminderSchedule;
};

type UpdateReminderInput = Partial<Omit<ReminderItem, "id" | "owner" | "createdAt">>;

type RemindersState = {
  reminders: ReminderItem[];

  // selectors/helpers
  getById: (id: string) => ReminderItem | undefined;
  getByOwner: (owner: ReminderOwner) => ReminderItem[];

  // CRUD
  addReminder: (input: CreateReminderInput) => string;
  updateReminder: (id: string, patch: UpdateReminderInput) => void;
  removeReminder: (id: string) => void;

  // scheduling state updates (manager hook çağıracak)
  setNotificationIds: (id: string, ids: string[]) => void;
  clearNotificationIds: (id: string) => void;
  setScheduledHash: (id: string, hash?: string) => void;
};

function generateReminderId() {
  // RN'de ekstra dependency istemeden yeterli unique id
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],

      getById: (id) => get().reminders.find((r) => r.id === id),

      getByOwner: (owner) => get().reminders.filter((r) => r.owner === owner),

      addReminder: (input) => {
        const id = generateReminderId();
        const now = Date.now();

        const item: ReminderItem = {
          id,
          owner: input.owner,
          enabled: input.enabled ?? true,
          title: input.title,
          body: input.body,
          target: input.target ?? { type: "general" },
          schedule: input.schedule,
          notificationIds: [],
          scheduledHash: undefined,
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({ reminders: [item, ...s.reminders] }));
        return id;
      },

      updateReminder: (id, patch) => {
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...patch,
                  updatedAt: Date.now(),
                }
              : r
          ),
        }));
      },

      removeReminder: (id) => {
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
      },

      setNotificationIds: (id, ids) => {
        set((s) => ({
          reminders: s.reminders.map((r) => {
            if (r.id !== id) return r;
      
            const same =
              r.notificationIds.length === ids.length &&
              r.notificationIds.every((x, i) => x === ids[i]);
      
            return same ? r : { ...r, notificationIds: ids, updatedAt: Date.now() };
          }),
        }));
      },
      
      
      

      clearNotificationIds: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, notificationIds: [], updatedAt: Date.now() } : r
          ),
        }));
      },

      setScheduledHash: (id, hash) => {
        set((s) => ({
          reminders: s.reminders.map((r) => {
            if (r.id !== id) return r;
            return r.scheduledHash === hash
              ? r
              : { ...r, scheduledHash: hash, updatedAt: Date.now() };
          }),
        }));
      },
      
      
      
    }),
    {
      name: "reminders-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
