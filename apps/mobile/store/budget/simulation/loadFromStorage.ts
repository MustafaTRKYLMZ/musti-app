// apps/mobile/store/simulation/loadFromStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SimulationScenario, SimulationStore } from "@budget/core";
import { SIMULATION_STORAGE_KEY } from "./constants";
import type { SimulationStoreSet } from "./types";

export async function loadFromStorageAction(set: SimulationStoreSet) {
  try {
    const raw = await AsyncStorage.getItem(SIMULATION_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as {
      scenarios?: SimulationScenario[];
      activeScenarioId?: string | null;
    };

    set((state: SimulationStore) => ({
      ...state,
      scenarios: parsed.scenarios ?? [],
      activeScenarioId: parsed.activeScenarioId ?? null,
    }));
  } catch (e) {
    console.log("Failed to load simulation store", e);
  }
}
