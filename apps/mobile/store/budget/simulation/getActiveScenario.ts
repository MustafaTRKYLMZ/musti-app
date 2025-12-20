
import type { SimulationScenario } from "@budget/core";
import type { SimulationStoreGet } from "./types";

export function getActiveScenarioSelector(
  get: SimulationStoreGet
): SimulationScenario | null {
  const { scenarios, activeScenarioId } = get();
  if (!activeScenarioId) return null;
  return scenarios.find((s) => s.id === activeScenarioId) ?? null;
}
