
import dayjs from "dayjs";
import { nanoid } from "nanoid/non-secure";
import type { SimulationScenario } from "@budget/core";
import type { SimulationStoreSet } from "./types";
import { persistSimulationState } from "./persistState";

export function addScenarioAction(set: SimulationStoreSet, name: string) {
  const id = nanoid();
  const todayStr = dayjs().format("YYYY-MM-DD");

  const scenario: SimulationScenario = {
    id,
    name,
    createdAt: dayjs().toISOString(),
    items: [],
    targetDate: todayStr,
  };

  set((state) => {
    const next = {
      ...state,
      scenarios: [...state.scenarios, scenario],
      activeScenarioId: id,
    };
    void persistSimulationState({
      scenarios: next.scenarios,
      activeScenarioId: next.activeScenarioId,
    });
    return next;
  });
}
