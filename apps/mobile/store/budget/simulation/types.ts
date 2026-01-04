// apps/mobile/store/simulation/types.ts

import type { SimulationStore } from "/core";

export type SimulationStoreSet = (
  partial:
    | SimulationStore
    | Partial<SimulationStore>
    | ((state: SimulationStore) => SimulationStore | Partial<SimulationStore>)
) => void;

export type SimulationStoreGet = () => SimulationStore;
