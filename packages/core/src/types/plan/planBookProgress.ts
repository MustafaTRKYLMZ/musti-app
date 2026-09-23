export type PlanBookProgress = {
    bookUri: string;
    currentPageInBook: number; // 1-based
    pagesReadToday: number;
    bookTotalPages?: number;
  };
  