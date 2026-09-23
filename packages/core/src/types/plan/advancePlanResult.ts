import { ReadingPlan } from "./readingPlan";

  export type AdvancePlanResult = {
    plan: ReadingPlan;
    pagesConsumed: number;
    pagesRemainingInput: number;
  };