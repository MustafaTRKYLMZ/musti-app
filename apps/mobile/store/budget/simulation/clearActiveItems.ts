
import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet, SimulationStoreGet } from "./types";

export function clearActiveItemsAction(
  set: SimulationStoreSet,
  get: SimulationStoreGet
) {
  const { activeScenarioId } = get();
  if (!activeScenarioId) return;

  set((state) => {
    const nextScenarios = state.scenarios.map((s) =>
      s.id === activeScenarioId ? { ...s, items: [] } : s
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
