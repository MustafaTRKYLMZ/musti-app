
import { create } from "zustand";
import { addItemToActiveAction } from "./addItemToActive";
import { addScenarioAction } from "./addScenario";
import { clearActiveItemsAction } from "./clearActiveItems";
import { deleteScenarioAction } from "./deleteScenario";
import { duplicateScenarioAction } from "./duplicateScenario";
import { getActiveScenarioSelector } from "./getActiveScenario";
import { loadFromStorageAction } from "./loadFromStorage";
import { removeItemFromActiveAction } from "./removeItemFromActive";
import { renameScenarioAction } from "./renameScenario";
import { setActiveScenarioAction } from "./setActiveScenario";
import { setScenarioTargetDateAction } from "./setScenarioTargetDate";
import { useTransactionsStore } from "../transactions/useTransactionsStore";
import { computeBalanceOnDateWithSimulation, SimulationStore } from "@musti/core";

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  scenarios: [],
  activeScenarioId: null,

  async loadFromStorage() {
    await loadFromStorageAction(set);
  },

  addScenario(name) {
    addScenarioAction(set, name);
  },

  renameScenario(id, name) {
    renameScenarioAction(set, id, name);
  },

  deleteScenario(id) {
    deleteScenarioAction(set, get, id);
  },

  duplicateScenario(id) {
    duplicateScenarioAction(set, get, id);
  },

  setActiveScenario(id) {
    setActiveScenarioAction(set, id);
  },

  setScenarioTargetDate(id, date) {
    setScenarioTargetDateAction(set, id, date);
  },

  getActiveScenario() {
    return getActiveScenarioSelector(get);
  },

  addItemToActive(payload) {
    addItemToActiveAction(set, get, payload);
  },

  removeItemFromActive(itemId) {
    removeItemFromActiveAction(set, get, itemId);
  },

  clearActiveItems() {
    clearActiveItemsAction(set, get);
  },

  getBalanceOnDateWithSimulation(date) {
    const base = useTransactionsStore.getState().getBalanceOnDate(date);
    const active = get().getActiveScenario();
  
    if (!active) return base;
  
    return computeBalanceOnDateWithSimulation(
      base,
      active.items,
      date
    );
  }
  
}));
