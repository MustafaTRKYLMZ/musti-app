// packages/core/src/books/plan.ts

export type ReadingPlanItem = {
    id: string;
    bookUri: string;
    pages: number;    // pages to read for this item
    order: number;    // sequence order
  };
  
  export type ReadingPlan = {
    id: string;
    name: string;
  
    items: ReadingPlanItem[];
  
    currentIndex: number;       // index in items[]
    currentPageInItem: number;  // how many pages already read in this item
  
    isCompleted: boolean;
  
    createdAt: string;
    updatedAt: string;
  };
  
  export type AdvancePlanResult = {
    plan: ReadingPlan;
    pagesConsumed: number;
    pagesRemainingInput: number;
  };
  
  /**
   * Advance reading plan by a given number of pages.
   * Pages are applied to the current item, then next, etc.
   */
  export function advanceReadingPlan(
    plan: ReadingPlan,
    pagesRead: number
  ): AdvancePlanResult {
    if (pagesRead <= 0 || plan.isCompleted || plan.items.length === 0) {
      return {
        plan,
        pagesConsumed: 0,
        pagesRemainingInput: pagesRead,
      };
    }
  
    let pagesLeft = pagesRead;
    let pagesConsumed = 0;
  
    let currentIndex = plan.currentIndex;
    let currentPageInItem = plan.currentPageInItem;
    let isCompleted = plan.isCompleted;
  
    const items = plan.items;
  
    while (pagesLeft > 0 && !isCompleted && currentIndex < items.length) {
      const item = items[currentIndex];
      const remainingForItem = item.pages - currentPageInItem;
  
      if (remainingForItem <= 0) {
        // this item already finished, move to next
        currentIndex += 1;
        currentPageInItem = 0;
        if (currentIndex >= items.length) {
          isCompleted = true;
        }
        continue;
      }
  
      if (pagesLeft >= remainingForItem) {
        // finish this item and move on
        pagesLeft -= remainingForItem;
        pagesConsumed += remainingForItem;
        currentIndex += 1;
        currentPageInItem = 0;
  
        if (currentIndex >= items.length) {
          isCompleted = true;
        }
      } else {
        // partially complete this item
        currentPageInItem += pagesLeft;
        pagesConsumed += pagesLeft;
        pagesLeft = 0;
      }
    }
  
    const updatedPlan: ReadingPlan = {
      ...plan,
      currentIndex,
      currentPageInItem,
      isCompleted,
      updatedAt: new Date().toISOString(),
    };
  
    return {
      plan: updatedPlan,
      pagesConsumed,
      pagesRemainingInput: pagesLeft,
    };
  }
  