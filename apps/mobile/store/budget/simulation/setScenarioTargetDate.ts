
import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet } from "./types";

export function setScenarioTargetDateAction(
  set: SimulationStoreSet,
  id: string,
  date: string
) {
  set((state) => {
    const nextScenarios = state.scenarios.map((s) =>
      s.id === id ? { ...s, targetDate: date } : s
    );

    const next = {
      ...state,
      scenarios: nextScenarios,
    };

    void persistSimulationState({
      scenarios: next.scenarios,
      activeScenarioId: next.activeScenarioId,
    });

    return next;
  });
}
