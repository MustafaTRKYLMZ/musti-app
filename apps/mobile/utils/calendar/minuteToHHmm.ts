import { pad2 } from "@musti/planner";

export const minuteToHHmm=(min: number)=> {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${pad2(h)}:${pad2(m)}`;
}

