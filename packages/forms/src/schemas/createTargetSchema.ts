import { z } from "zod";

export const createTargetSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),

    selectedBookId: z.string().nullable(),

    type: z.enum(["section", "pages"]),

    selectedSectionId: z.string().nullable(),

    startPageInput: z.string(),
    endPageInput: z.string(),

    repeat: z.object({
      enabled: z.boolean(),
      freq: z.enum(["daily", "weekly", "monthly"]),
      interval: z.string(),
      timeOfDay: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time (HH:mm)"),
      weekdays: z.array(z.number()),
      endKind: z.enum(["never", "until", "count"]),
      untilDate: z.date(),
      countRemaining: z.string(),
      showUntilPicker: z.boolean(),
    }),
  })
  .superRefine((val, ctx) => {
    if (val.type === "pages") {
      const start = Math.floor(Number(val.startPageInput) || 0);
      const end = Math.floor(Number(val.endPageInput) || 0);

      if (start <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["startPageInput"],
          message: "Start page is required",
        });
      }

      if (end <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["endPageInput"],
          message: "End page is required",
        });
      }

      if (start > 0 && end > 0 && end <= start) {
        ctx.addIssue({
          code: "custom",
          path: ["endPageInput"],
          message: "End page must be greater than start page",
        });
      }
    }

    // Repeat validation (only if enabled)
    if (val.repeat.enabled) {
      const interval = Math.floor(Number(val.repeat.interval) || 0);
      if (interval < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["repeat", "interval"],
          message: "Interval must be at least 1",
        });
      }

      if (val.repeat.freq === "weekly") {
        const w = val.repeat.weekdays ?? [];
        if (!w.length) {
          ctx.addIssue({
            code: "custom",
            path: ["repeat", "weekdays"],
            message: "Pick at least one weekday",
          });
        }

        // optional: range guard
        const bad = w.some((d) => d < 0 || d > 6);
        if (bad) {
          ctx.addIssue({
            code: "custom",
            path: ["repeat", "weekdays"],
            message: "Weekdays must be between 0 and 6",
          });
        }
      }

      if (val.repeat.endKind === "count") {
        const c = Math.floor(Number(val.repeat.countRemaining) || 0);
        if (c < 1) {
          ctx.addIssue({
            code: "custom",
            path: ["repeat", "countRemaining"],
            message: "Count must be at least 1",
          });
        }
      }
    }
  });
