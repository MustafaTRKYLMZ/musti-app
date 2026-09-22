import { mergeReceiptTexts, parseReceiptText } from "@musti/core";

describe("mergeReceiptTexts", () => {
  it("deduplicates overlapping lines between top and bottom photos", () => {
    const top = `
JUMBO
Amsterdam
Date: 21-09-2025
Product 1  2.50
Product 2  3.40
Product 3  1.20
    `.trim();

    const bottom = `
Product 3  1.20
Product 4  4.80
Product 5  2.10
TOTAL 14.00
    `.trim();

    const merged = mergeReceiptTexts(top, bottom);
    const { draft } = parseReceiptText(merged);

    expect(draft.lines.length).toBeGreaterThanOrEqual(5);
    expect(merged.match(/Product 3/g)?.length).toBe(1);
    expect(draft.total).toBe(14);
  });

  it("concatenates when no overlap is found", () => {
    const top = "JUMBO\nProduct A 1.00";
    const bottom = "Product B 2.00\nTOTAL 3.00";

    const merged = mergeReceiptTexts(top, bottom);
    expect(merged).toContain("Product A");
    expect(merged).toContain("Product B");
  });
});
