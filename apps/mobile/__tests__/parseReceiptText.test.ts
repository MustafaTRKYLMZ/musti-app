import {
  GROCERY_DESCRIPTION_LINE_THRESHOLD,
  MAX_RECEIPT_LINE_ITEMS,
  parseReceiptText,
  storeNamesMatch,
} from "@musti/core";

describe("parseReceiptText", () => {
  it("extracts Jumbo receipt total and store", () => {
    const text = `
JUMBO
Amsterdam
Date: 21-09-2025
Bread 2.50
TOTAL 35.00
Bedankt
    `.trim();

    const { draft, hints } = parseReceiptText(text);

    expect(draft.storeName.toLowerCase()).toContain("jumbo");
    expect(draft.total).toBe(35);
    expect(draft.date).toBe("2025-09-21");
    expect(hints.total.confidence).toBe("high");
    expect(draft.lines.length).toBeGreaterThan(0);
    expect(draft.lines.some((l) => l.name.toLowerCase().includes("bread"))).toBe(
      true
    );
  });

  it("extracts Turkish Migros receipt", () => {
    const text = `
MIGROS
TARİH: 15.03.2025
Süt 1L 45,90 TL
Ekmek 15,00 TL
GENEL TOPLAM 60,90
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.storeName.toLowerCase()).toContain("migros");
    expect(draft.total).toBe(60.9);
    expect(draft.currency).toBe("TRY");
    expect(draft.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to last money amount when total label missing", () => {
    const text = "Shop\n12.40\n18.90\n3.20";
    const { draft } = parseReceiptText(text);
    expect(draft.total).toBe(3.2);
  });

  it("prefers Shell brand over cashier name on Dutch fuel receipt", () => {
    const text = `
Art Ilkel
6921 XX Duiven
Shell
Huissen
Datum: 21-09-2025
EURO 95
45,32 L
TOTAAL 85,00
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.storeName).toBe("Shell Huissen");
    expect(draft.description).toBe("Yakıt");
    expect(draft.suggestedCategory).toBe("transport");
  });

  it("ignores Jouw voordeel for total and parses split AH product rows", () => {
    const text = `
ALBERT HEIJN 1511
Datum 21-09-2025
Aantal Omschrijving Prijs Bedrag
1 AH MELK HALFVOL
1.89
1.89 B
1 AH BANANEN
0.65
0.65 B
Subtotaal
2.54
Jouw voordeel
0.20
Btw hoog 21%
0.41
Totaal
2.75
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.total).toBe(2.75);
    expect(draft.lines.length).toBe(2);
    expect(draft.lines.some((l) => l.name.toLowerCase().includes("melk"))).toBe(
      true
    );
    expect(draft.lines.some((l) => l.name.toLowerCase().includes("bananen"))).toBe(
      true
    );
  });

  it("parses Albert Heijn table header and column rows", () => {
    const text = `
Aantal Omscriving Pris Bedrag
1 AH MELK HALFVOL 1.89 1.89 B
2 AH BANANEN 0.65 1.30 B
Subtotaal 3.19
Btw hoog 21% 0.56
Totaal 3.75
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.storeName).toBe("Albert Heijn");
    expect(draft.total).toBe(3.75);
    expect(draft.lines.length).toBe(2);
    expect(draft.lines[0].name.toLowerCase()).toContain("melk");
    expect(draft.lines[0].quantity).toBe(1);
    expect(draft.lines[1].quantity).toBe(2);
  });

  it("parses Albert Heijn receipt with split euro lines", () => {
    const text = `
ALBERT HEIJN
Datum 21-09-2025
AH MELK HALFVOL
€ 1,89
AH BANANEN
€ 1,29
Subtotaal
€ 3,18
Btw hoog 21%
€ 0,55
Totaal
€ 3,73
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.storeName.toLowerCase()).toContain("albert heijn");
    expect(draft.total).toBe(3.73);
    expect(draft.lines.length).toBeGreaterThanOrEqual(2);
    expect(draft.lines.some((l) => l.name.toLowerCase().includes("melk"))).toBe(
      true
    );
  });

  it("uses grand total instead of VAT or subtotal", () => {
    const text = `
JUMBO
Amsterdam
Date: 21-09-2025
Melk 2.98
Brood 1.89
SUBTOTAAL 4.87
BTW 21% 1.02
TOTAAL TE BETALEN 5.89
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.total).toBe(5.89);
    expect(draft.lines.some((l) => /btw|vat|kdv/i.test(l.name))).toBe(false);
  });

  it("parses Dutch supermarket lines with quantity prefix", () => {
    const text = `
JUMBO
Utrecht
Datum: 21-09-2025
2 MELK HALFVOL 2.98
BANANEN 1.89
TOMATEN 0.850 kg 3.45
TOTAAL 8.32
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.storeName.toLowerCase()).toContain("jumbo");
    expect(draft.lines.length).toBeGreaterThanOrEqual(3);
    expect(draft.lines.some((l) => l.name.toLowerCase().includes("melk"))).toBe(
      true
    );
    expect(
      draft.lines.some(
        (l) => l.unit === "kg" && l.name.toLowerCase().includes("tomaten")
      )
    ).toBe(true);
  });

  it("extracts 50+ grocery lines and uses store name as description", () => {
    const items = Array.from({ length: 55 }, (_, index) => {
      const n = index + 1;
      return `Product ${n}  ${(n * 0.5 + 1).toFixed(2)}`;
    }).join("\n");

    const text = `
JUMBO
Amsterdam
Date: 21-09-2025
${items}
TOTAL 150.25
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.lines.length).toBe(55);
    expect(draft.lines.length).toBeLessThanOrEqual(MAX_RECEIPT_LINE_ITEMS);
    expect(draft.description.toLowerCase()).toContain("jumbo");
    expect(draft.lines.length).toBeGreaterThanOrEqual(
      GROCERY_DESCRIPTION_LINE_THRESHOLD
    );
  });

  it("maps fuel receipt to Yakıt product and Ulaşım category with liters", () => {
    const text = `
SHELL
TARİH: 21.09.2025
EURO 95 BENZIN
45,32 L
TOPLAM 1.234,56 TL
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.storeName.toLowerCase()).toContain("shell");
    expect(draft.description).toBe("Yakıt");
    expect(draft.suggestedCategory).toBe("transport");
    expect(draft.lines.length).toBe(1);
    expect(draft.lines[0].name).toBe("Yakıt");
    expect(draft.lines[0].unit).toBe("L");
    expect(draft.lines[0].quantity).toBeCloseTo(45.32, 2);
  });

  it("uses printed TOTAAL on scrambled AH receipt, not cash minus change", () => {
    const text = `
Albert Hei jn Driessen Elst
TOTAAL
JOU VOORDEEL
AH BANANEN
DRUIVEN
MANDARI JNEN
SUBTOTAAL
CONTANT
330 Xx3241 2.90 5.58 B
4.49 B 12.97
-2.09
-1.00
3.09
0.00
9.88
20.00
10.10
    `.trim();

    const { draft } = parseReceiptText(text);

    expect(draft.total).toBe(9.88);
    expect(draft.lines.map((l) => l.name)).toEqual(
      expect.arrayContaining(["AH BANANEN", "DRUIVEN", "MANDARI JNEN"])
    );
  });
});

describe("storeNamesMatch", () => {
  it("matches similar store names", () => {
    expect(storeNamesMatch("Jumbo", "jumbo")).toBe(true);
    expect(storeNamesMatch("Albert Heijn", "AH")).toBe(false);
  });
});
