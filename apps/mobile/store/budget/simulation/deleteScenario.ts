
import type { SimulationStore } from "@budget/core";
import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet, SimulationStoreGet } from "./types";

export function deleteScenarioAction(
  set: SimulationStoreSet,
  get: SimulationStoreGet,
  id: string
) {
  set((state) => {
    const filtered = state.scenarios.filter((s) => s.id !== id);
    const wasActive = state.activeScenarioId === id;

    const next: SimulationStore = {
      ...state,
      scenarios: filtered,
      activeScenarioId: wasActive
        ? filtered.length > 0
          ? filtered[0].id
          : null
        : state.activeScenarioId,
    };

    void persistSimulationState({
      scenarios: next.scenarios,
      activeScenarioId: next.activeScenarioId,
    });

    return next;
  });
}
