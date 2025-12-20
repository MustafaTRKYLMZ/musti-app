// apps/mobile/store/simulation/persistState.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SimulationScenario } from "@budget/core";
import { SIMULATION_STORAGE_KEY } from "./constants";

export async function persistSimulationState(partial: {
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
}) {
  try {
    const json = JSON.stringify(partial);
    await AsyncStorage.setItem(SIMULATION_STORAGE_KEY, json);
  } catch (e) {
    console.log("Failed to persist simulation store", e);
  }
}
