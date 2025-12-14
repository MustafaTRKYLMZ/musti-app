
import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet } from "./types";

export function setActiveScenarioAction(
  set: SimulationStoreSet,
  id: string | null
) {
  set((state) => {
    const next = { ...state, activeScenarioId: id };

    void persistSimulationState({
      scenarios: next.scenarios,
      activeScenarioId: next.activeScenarioId,
    });

    return next;
  });
}
