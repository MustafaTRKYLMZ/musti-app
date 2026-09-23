import * as fs from "fs";
import * as path from "path";
import { parseReceiptText } from "../../../packages/core/src/receipt/parseReceiptText";
import { extractDeclaredItemCount } from "../../../packages/core/src/receipt/extractDeclaredItemCount";
import { resolveReceiptStoreProfile } from "../../../packages/core/src/receipt/receiptStoreProfiles";

const FIXTURES_DIR = path.join(__dirname, "fixtures", "receipts");

type GoldenCase = {
  file: string;
  minLines?: number;
  minTotal?: number;
  storeIncludes?: string;
  profileId?: string;
  declaredCount?: number;
  receiptType?: "market" | "fuel" | "restaurant";
};

const CASES: GoldenCase[] = [
  {
    file: "guven-positional.txt",
    minLines: 2,
    minTotal: 80,
    storeIncludes: "guven",
    profileId: "guven_positional",
    declaredCount: 30,
  },
  {
    file: "ah-scattered.txt",
    minLines: 2,
    minTotal: 3,
    storeIncludes: "albert",
    profileId: "ah_scattered",
  },
  {
    file: "jumbo-table.txt",
    minLines: 2,
    minTotal: 4,
    storeIncludes: "jumbo",
    profileId: "jumbo_table",
  },
  {
    file: "migros-tr.txt",
    minLines: 1,
    minTotal: 60,
    storeIncludes: "migros",
    profileId: "migros_standard",
  },
  {
    file: "shell-fuel.txt",
    minLines: 1,
    minTotal: 85,
    storeIncludes: "shell",
    profileId: "fuel_station",
    receiptType: "fuel",
  },
  {
    file: "action-table.txt",
    minLines: 2,
    minTotal: 2,
    storeIncludes: "action",
    profileId: "action_table",
  },
  {
    file: "kruidvat-table.txt",
    minLines: 2,
    minTotal: 5,
    storeIncludes: "kruidvat",
    profileId: "kruidvat_table",
  },
  {
    file: "etos-table.txt",
    minLines: 1,
    minTotal: 8,
    storeIncludes: "etos",
    profileId: "etos_table",
  },
  {
    file: "carrefour-tr.txt",
    minLines: 1,
    minTotal: 115,
    storeIncludes: "carrefour",
    profileId: "carrefour_standard",
  },
  {
    file: "tesco-en.txt",
    minLines: 0,
    minTotal: 2,
    storeIncludes: "tesco",
    profileId: "tesco_table",
  },
  {
    file: "bim-tr.txt",
    minLines: 1,
    minTotal: 82,
    storeIncludes: "bim",
    profileId: "turkish_market",
  },
  {
    file: "bp-fuel.txt",
    minLines: 1,
    minTotal: 72,
    storeIncludes: "bp",
    profileId: "fuel_station",
    receiptType: "fuel",
  },
];

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), "utf8");
}

describe("golden receipt OCR fixtures", () => {
  it.each(CASES)("$file parses store, total, and lines", (testCase) => {
    const text = loadFixture(testCase.file);
    const result = parseReceiptText(text, {
      receiptType: testCase.receiptType,
    });

    if (testCase.storeIncludes) {
      expect(result.draft.storeName.toLowerCase()).toContain(
        testCase.storeIncludes
      );
    }

    if (testCase.minTotal != null) {
      expect(result.draft.total).toBeGreaterThanOrEqual(testCase.minTotal);
    }

    if (testCase.minLines != null) {
      expect(result.draft.lines.length).toBeGreaterThanOrEqual(
        testCase.minLines
      );
    }

    if (testCase.profileId) {
      const profile = resolveReceiptStoreProfile(
        result.draft.storeName,
        text
      );
      expect(profile?.id).toBe(testCase.profileId);
    }

    if (testCase.declaredCount != null) {
      expect(extractDeclaredItemCount(text)).toBe(testCase.declaredCount);
    }
  });
});
