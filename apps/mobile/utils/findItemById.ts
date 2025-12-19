import { ReadingTarget } from "@/store/bookshelf/useReadingTargetsStore";

export   const findItemById=(t: ReadingTarget | null, itemId: string | null) =>{
    if (!t || !itemId) return null;
    return t.items.find((x) => x.id === itemId) ?? null;
  }
