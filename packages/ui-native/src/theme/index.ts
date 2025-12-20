// packages/ui-native/src/theme/index.ts

export * from "./types";
export * from "./tokens";
export * from "./budget";
export * from "./bookshelf";

import { budgetTheme } from "./budget";

export const colors = budgetTheme.colors;
