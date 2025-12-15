// apps/mobile/store/simulation/duplicateScenario.ts

import dayjs from "dayjs";
import { nanoid } from "nanoid/non-secure";
import type { SimulationItem, SimulationScenario } from "@budget/core";
import { persistSimulationState } from "./persistState";
import type { SimulationStoreSet, SimulationStoreGet } from "./types";

export function duplicateScenarioAction(
  set: SimulationStoreSet,
  get: SimulationStoreGet,
  id: string
) {
  set((state) => {
    const original = state.scenarios.find((s) => s.id === id);
    if (!original) return state;

    const newId = nanoid();
    const now = dayjs().toISOString();

    const copyName = original.name.endsWith(" copy")
      ? `${original.name} 2`
      : `${original.name} copy`;

    const clonedItems: SimulationItem[] = original.items.map((it) => ({
      ...it,
      id: nanoid(),
    }));

    const copyScenario: SimulationScenario = {
      id: newId,
      name: copyName,
      createdAt: now,
      items: clonedItems,
      targetDate: original.targetDate ?? dayjs().format("YYYY-MM-DD"),
    };

    const next = {
      ...state,
      scenarios: [...state.scenarios, copyScenario],
      activeScenarioId: newId,
    };

    void persistSimulationState({
      scenarios: next.scenarios,
      activeScenarioId: next.activeScenarioId,
    });

    return next;
  });
}
