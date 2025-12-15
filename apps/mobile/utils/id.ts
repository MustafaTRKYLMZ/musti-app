import { nanoid } from "nanoid/non-secure";


export function createId(prefix?: string) {
  const id = nanoid();

  return prefix ? `${prefix}_${id}` : id;
}
