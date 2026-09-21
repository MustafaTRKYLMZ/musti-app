import { spacing } from "@musti/ui-native";

/** Vertical offset of ShelfPlank SVG relative to row bottom (more negative = lower). */
export const BOOK_TO_SHELF_GAP = -40;

/** Lift books slightly above the shelf surface. */
export const BOOK_SHELF_LIFT = 10;

/** Space below each shelf row before the next row starts. */
export const SHELF_ROW_GAP = spacing.md;

/** Gap between “Last read” block and “Books” section. */
export const LAST_READ_TO_BOOKS_GAP = spacing.xs;

/** Section header → content (matches TargetList / PlanList). */
export const SECTION_HEADER_GAP = spacing.sm;
