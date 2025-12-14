// apps/mobile/store/simulation/renameScenario.ts

import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet } from "./types";

export function renameScenarioAction(
  set: SimulationStoreSet,
  id: string,
  name: string
) {
  set((state) => {
    const next = {
      ...state,
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    };

    void persistSimulationState({
      scenarios: next.scenarios,
      activeScenarioId: next.activeScenarioId,
    });

    return next;
  });
}
