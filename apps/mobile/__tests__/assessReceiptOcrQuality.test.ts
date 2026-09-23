import { assessReceiptOcrQuality } from "../../../packages/core/src/receipt/assessReceiptOcrQuality";
import type { ParseReceiptResult } from "../../../packages/core/src/types/receipt";

function mockParseResult(
  overrides: Partial<ParseReceiptResult> = {}
): ParseReceiptResult {
  return {
    draft: {
      rawText: "",
      storeName: "Market",
      date: "2025-09-22",
      total: 0,
      currency: "EUR",
      description: "Groceries",
      lines: [],
      ...overrides.draft,
    },
    hints: {
      store: { value: "Market", confidence: "medium" },
      date: { value: "2025-09-22", confidence: "medium" },
      total: { value: 0, confidence: "low" },
      currency: { value: "EUR", confidence: "high" },
      ...overrides.hints,
    },
  };
}

describe("assessReceiptOcrQuality", () => {
  it("flags very short OCR as poor and suggests retake", () => {
    const text = "JUMBO\n12.50";
    const quality = assessReceiptOcrQuality(text, mockParseResult(), {
      photoCount: 1,
    });

    expect(quality.level).toBe("poor");
    expect(quality.suggestRetake).toBe(true);
  });

  it("suggests a second photo for long but incomplete receipts", () => {
    const lines = Array.from({ length: 12 }, (_, index) => `Item ${index + 1} 1.99`);
    const text = ["MARKET", ...lines].join("\n");
    const quality = assessReceiptOcrQuality(
      text,
      mockParseResult({
        draft: {
          rawText: text,
          storeName: "Market",
          date: "2025-09-22",
          total: 0,
          currency: "EUR",
          description: "Groceries",
          lines: lines.map((line, index) => ({
            name: `Item ${index + 1}`,
            totalAmount: 1.99,
          })),
        },
      }),
      { photoCount: 1 }
    );

    expect(quality.suggestSecondPhoto).toBe(true);
  });

  it("suggests save-total-only when total exists but no line items parsed", () => {
    const text = "TESCO\nDate 22-09-2025\nTOTAL 42.80";
    const quality = assessReceiptOcrQuality(
      text,
      mockParseResult({
        draft: {
          rawText: text,
          storeName: "TESCO",
          date: "2025-09-22",
          total: 42.8,
          currency: "EUR",
          description: "Groceries",
          lines: [],
        },
        hints: {
          store: { value: "TESCO", confidence: "high" },
          date: { value: "2025-09-22", confidence: "high" },
          total: { value: 42.8, confidence: "high" },
          currency: { value: "EUR", confidence: "high" },
        },
      }),
      { photoCount: 1 }
    );

    expect(quality.suggestSaveTotalOnly).toBe(true);
  });
});
