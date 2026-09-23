import { extractDeclaredItemCount } from "../../../packages/core/src/receipt/extractDeclaredItemCount";
import { extractPositionalBlockProducts } from "../../../packages/core/src/receipt/extractPositionalBlockProducts";

describe("long receipt parsing", () => {
  it("extracts declared item count from Dutch receipts", () => {
    expect(extractDeclaredItemCount("Kassa 5\nRegels: 30\nTOTAL 143.20")).toBe(
      30
    );
  });

  it("pairs name block with qty x price block", () => {
    const lines = [
      "ULKER SUTLU CIKOLATA 33G",
      "SIMIT/SESAMRING",
      "ACMA",
      "PITIL/PITA",
      "SOMUN MINI 2 x 1.49 = EUR 2.98 C",
      "Kassa 5",
      "Regels: 4",
      "4 x 1.99 = EUR 7.96 C",
      "1,842 x 19.99 = EUR 36.82 C",
      "3 x 1.25 = EUR 3.75 C",
      "TOTAAL 143.20",
    ];

    const items = extractPositionalBlockProducts(lines, lines.length - 1);
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items.some((item) => item.name.includes("ULKER"))).toBe(true);
    expect(items.some((item) => item.totalAmount === 7.96)).toBe(true);
  });
});
