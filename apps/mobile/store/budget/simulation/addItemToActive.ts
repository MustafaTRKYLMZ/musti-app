
import dayjs from "dayjs";
import { nanoid } from "nanoid/non-secure";
import type { SimulationItem, SimulationScenario } from "@budget/core";
import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet, SimulationStoreGet } from "./types";

export function addItemToActiveAction(
  set: SimulationStoreSet,
  get: SimulationStoreGet,
  payload: Omit<SimulationItem, "id">
) {
  const { activeScenarioId, scenarios } = get();

  // If no active scenario yet, implicitly create one
  if (!activeScenarioId) {
    const id = nanoid();
    const todayStr = dayjs().format("YYYY-MM-DD");

    const newScenario: SimulationScenario = {
      id,
      name: "New scenario",
      createdAt: dayjs().toISOString(),
      items: [],
      targetDate: todayStr,
    };

    const newItem: SimulationItem = {
      id: nanoid(),
      ...payload,
    };
    newScenario.items.push(newItem);

    const next = {
      scenarios: [...scenarios, newScenario],
      activeScenarioId: id,
    };

    set((state) => ({
      ...state,
      ...next,
    }));

    void persistSimulationState(next);
    return;
  }

  // Active scenario exists
  set((state) => {
    const nextScenarios = state.scenarios.map((s) =>
      s.id === activeScenarioId
        ? {
            ...s,
            items: [
              ...s.items,
              {
                id: nanoid(),
                ...payload,
              },
            ],
          }
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
