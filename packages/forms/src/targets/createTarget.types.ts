import type { TargetType } from "@musti/core";

export type CreateTargetFormValues = {
  title: string;

  selectedBookId: string | null;
  type: TargetType; // "section" | "pages"

  selectedSectionId: string | null;

  startPageInput: string;
  endPageInput: string;

  repeat: {
    enabled: boolean;
    freq: "daily" | "weekly" | "monthly";
    interval: string; 
    timeOfDay: string; 
    weekdays: number[]; 
    endKind: "never" | "until" | "count";
    untilDate: Date;
    countRemaining: string;
    showUntilPicker: boolean;
  };
};
