import { TargetItem, TargetStatus } from "./targetItem";

export type ReadingTarget = {
    id: string;
    createdAt: number;
  
    title: string;
    status: TargetStatus;
    doneAt?: number;
  
    items: TargetItem[];
  };