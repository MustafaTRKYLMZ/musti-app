
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
  
    // ✅ target-run baseline + cursor (target progress)
    activeFromPage: number; // run baseline (reset on restart)
    cursorPage: number; // current page within target run
  
    status: TargetItemStatus;
    doneAt?: number;
  };