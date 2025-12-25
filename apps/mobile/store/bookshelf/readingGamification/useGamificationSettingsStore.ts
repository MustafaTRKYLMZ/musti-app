import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_GAMIFICATION_SETTINGS,
  sanitizeSettings,
} from "./settings";
import { GamificationSettings } from "./types";

const STORAGE_KEY = "reading_gamification_settings_v1";

type SettingsState = {
  hydrated: boolean;
  settings: GamificationSettings;

  hydrate: () => Promise<void>;
  update: (patch: Partial<GamificationSettings>) => Promise<void>;
  reset: () => Promise<void>;
};

export const useGamificationSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_GAMIFICATION_SETTINGS,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true, settings: DEFAULT_GAMIFICATION_SETTINGS });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<GamificationSettings>;
      set({ hydrated: true, settings: sanitizeSettings(parsed) });
    } catch {
      set({ hydrated: true, settings: DEFAULT_GAMIFICATION_SETTINGS });
    }
  },

  update: async (patch) => {
    const next = sanitizeSettings({ ...get().settings, ...patch });
    set({ settings: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  reset: async () => {
    set({ settings: DEFAULT_GAMIFICATION_SETTINGS });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_GAMIFICATION_SETTINGS)
    );
  },
}));
