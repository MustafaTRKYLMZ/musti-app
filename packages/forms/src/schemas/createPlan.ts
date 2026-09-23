// packages/forms/src/plans/createPlan.ts
import { z } from "zod";

export const planItemSchema = z.object({
  bookUri: z.string().min(1, "Book is required"),
  bookName: z.string().min(1, "Book name is required"),
  // TextInput kolaylığı için string tutuyoruz
  pagesPerDay: z
    .string()
    .transform((v) => (v ?? "").trim())
    .refine((v) => /^\d+$/.test(v), "Enter a number")
    .transform((v) => Number(v))
    .refine((n) => Number.isFinite(n) && n > 0, "Pages/day must be > 0"),
});

export const createPlanSchema = z.object({
  name: z
    .string()
    .min(1, "Plan name is required")
    .transform((v) => (v ?? "").trim()),
  items: z.array(planItemSchema).min(1, "Add at least 1 book"),
});

export type CreatePlanFormValues = z.input<typeof createPlanSchema>; // input type (pagesPerDay string)
export type CreatePlanParsed = z.output<typeof createPlanSchema>; // parsed type (pagesPerDay number)

export const createPlanDefaultValues: CreatePlanFormValues = {
  name: "Reading plan",
  items: [],
};
