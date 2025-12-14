
import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet, SimulationStoreGet } from "./types";

export function removeItemFromActiveAction(
  set: SimulationStoreSet,
  get: SimulationStoreGet,
  itemId: string
) {
  const { activeScenarioId } = get();
  if (!activeScenarioId) return;

  set((state) => {
    const nextScenarios = state.scenarios.map((s) =>
      s.id === activeScenarioId
        ? { ...s, items: s.items.filter((it) => it.id !== itemId) }
        : s
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
