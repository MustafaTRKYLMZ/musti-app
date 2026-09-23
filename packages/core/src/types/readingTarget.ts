import { TargetItem, TargetStatus } from "./targetItem";

export type TargetRepeatFreq = "daily" | "weekly" | "monthly";

export type TargetRepeatEnd =
  | { kind: "never" }
  | { kind: "until"; untilAt: number }   
  | { kind: "count"; remaining: number; total: number };

export type TargetRepeat = {
  freq: "daily" | "weekly" | "monthly";
  interval?: number;
  weekdays?: number[];
  timeOfDay?: string; 
  end?: TargetRepeatEnd; 
};


export type ReadingTarget = {
  id: string;
  createdAt: number;

  title: string;
  status: TargetStatus;
  doneAt?: number;
  items: TargetItem[];
  repeat?: TargetRepeat;
  cycleStartAt: number;        
  nextResetAt?: number;
  lastResetAt?: number;

  cycleCompletedAt?: number;
};
