import { SimulationScenario } from "./simulation";
import { LocalTransaction } from "./transaction";

export type BackupV1 = {
  version: 1;
  app: "musti-app";
  exportedAt: string;
  data: {
    transactions: LocalTransaction[];
    scenarios: SimulationScenario[]; 
    settings: {
      initialBalance: {
        amount: number;
        date: string;
      } | null;
    };
  };
};
