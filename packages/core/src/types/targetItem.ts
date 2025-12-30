
export type TargetStatus = "active" | "done"; // group status
export type TargetItemStatus = "active" | "pending" | "done"; // item status
export type TargetType = "section" | "pages";



export type TargetItem = {
  id: string;

  bookUri: string;
  bookName: string;

  type: TargetType;

  startPage: number;
  endPage: number;
  jumpPage: number;

  labelId: string;
  label: string;

  activeFromPage: number;
  cursorPage: number;

  status: TargetItemStatus;
  doneAt?: number;
};