import { mergeManyReceiptTexts } from "../../../packages/core/src/receipt/mergeReceiptTexts";
import { resolveReceiptStoreProfile } from "../../../packages/core/src/receipt/receiptStoreProfiles";

describe("receiptStoreProfiles", () => {
  it("matches Guven positional profile", () => {
    const profile = resolveReceiptStoreProfile(
      "Guven Supermarkt V",
      "KASSABON Regels: 30"
    );
    expect(profile?.id).toBe("guven_positional");
    expect(profile?.preferPositionalBlock).toBe(true);
  });

  it("matches Albert Heijn scattered profile", () => {
    const profile = resolveReceiptStoreProfile(
      "Albert Heijn",
      "AH BONUS DRUIVEN"
    );
    expect(profile?.id).toBe("ah_scattered");
  });

  it("matches Action table profile", () => {
    const profile = resolveReceiptStoreProfile("Action", "Aantal Omschrijving");
    expect(profile?.id).toBe("action_table");
  });

  it("matches fuel station profile", () => {
    const profile = resolveReceiptStoreProfile("Shell", "Pomp 3 liter");
    expect(profile?.id).toBe("fuel_station");
  });

  it("matches Turkish market profile", () => {
    const profile = resolveReceiptStoreProfile("BIM", "GENEL TOPLAM");
    expect(profile?.id).toBe("turkish_market");
  });
});

describe("mergeManyReceiptTexts", () => {
  it("merges three receipt parts in order", () => {
    const top = "STORE\nItem A\nItem B";
    const middle = "Item B\nItem C\nItem D";
    const bottom = "Item D\nTOTAL 12.00";

    const merged = mergeManyReceiptTexts([top, middle, bottom]);
    expect(merged).toContain("Item A");
    expect(merged).toContain("Item C");
    expect(merged).toContain("TOTAL 12.00");
    expect(merged.match(/Item B/g)?.length).toBe(1);
    expect(merged.match(/Item D/g)?.length).toBe(1);
  });
});
