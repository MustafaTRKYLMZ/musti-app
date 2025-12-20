import { Book } from "../types/book";
import { DailyReadingPlan, ReadingSegment } from "../types/readingPlan";

export const getNextSegment = (
  plan: DailyReadingPlan
): ReadingSegment | null => {
  const sorted = [...plan.segments].sort((a, b) => a.order - b.order);
  return sorted.find((segment) => !segment.completed) ?? null;
};

export const isPlanCompleted = (plan: DailyReadingPlan): boolean => {
  return plan.segments.every((segment) => segment.completed);
};

export const applySegmentCompletionToBooks = (
  books: Book[],
  segment: ReadingSegment
): Book[] => {
  return books.map((book) => {
    if (book.id !== segment.bookId) return book;

    const nextPage = Math.max(book.currentPage, segment.endPage);
    return {
      ...book,
      currentPage: nextPage,
      updatedAt: new Date().toISOString(),
    };
  });
};
