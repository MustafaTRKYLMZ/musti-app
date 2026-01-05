import { budgetTheme } from "./budget";
import { plannerTheme } from "./planner";
import { bookshelfTheme } from "./bookshelf";
import { FABOwner, FABTheme } from "../components/Fab";

export const getTheme = (owner?: FABOwner): FABTheme => {
  switch (owner) {
    case "planner":
      return plannerTheme;
    case "bookshelf":
      return bookshelfTheme;
    default:
      return budgetTheme;
  }
};
