import { PlanBookProgress } from "./planBookProgress";
import { PlanItemConfig } from "./planItemConfig";

export type ReadingPlan = {
    id: string;
    name: string;
    items: PlanItemConfig[];//ReadingPlanItem[];
    perBook: Record<string, PlanBookProgress>;
    dayKey: string; // "YYYY-MM-DD"
    totalReadToday: number;
    currentIndex: number;      
    currentPageInItem: number;  // how many pages already read in this item
  
    isCompleted: boolean;
   updatedAt: string;
    createdAt: string;
  };
