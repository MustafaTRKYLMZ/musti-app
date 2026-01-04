import { SimulationItem } from "/core";
import dayjs from "dayjs";

export const getOccurrencesUntilDate = (
  item: SimulationItem,
  targetDateStr: string
): number => {
  const target = dayjs(targetDateStr).startOf("day");
  const start = dayjs(item.date).startOf("day");
  if (start.isAfter(target)) return 0;

  if (!item.isFixed) {
    return 1;
  }

  let count = 0;
  let current = start;

  while (!current.isAfter(target)) {
    count += 1;
    current = current.add(1, "month");
  }

  return count;
};
