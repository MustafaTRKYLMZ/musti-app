import type { CreateTargetFormValues } from "./createTarget.types";

export const createTargetDefaultValues: CreateTargetFormValues = {
  title: "",

  selectedBookId: null,
  type: "section",

  selectedSectionId: null,

  startPageInput: "",
  endPageInput: "",

  repeat: {
    enabled: false,
    freq: "weekly",
    interval: "1",
    timeOfDay: "00:00",
    weekdays: [1],
    endKind: "never",
    untilDate: new Date(),
    countRemaining: "10",
    showUntilPicker: false,
  },
};
