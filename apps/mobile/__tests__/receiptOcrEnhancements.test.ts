import { applyOcrCharacterSubstitutions } from "../../../packages/core/src/receipt/ocrCharacterSubstitutions";
import { reconstructReceiptTextFromBlocks } from "../../../packages/core/src/receipt/reconstructReceiptTextFromBlocks";
import { pickBestOcrText, scoreOcrText } from "../../../packages/core/src/receipt/scoreOcrText";

describe("ocrCharacterSubstitutions", () => {
  it("fixes common thermal OCR misreads", () => {
    const text = "T0TAL 12.50\nALBERT HE1JN\nx2 1.99";
    const fixed = applyOcrCharacterSubstitutions(text);
    expect(fixed).toContain("TOTAL 12.50");
    expect(fixed).toContain("ALBERT HEIJN");
    expect(fixed).toContain("×2 1.99");
  });
});

describe("reconstructReceiptTextFromBlocks", () => {
  it("merges column elements into product lines", () => {
    const text = reconstructReceiptTextFromBlocks([
      {
        text: "AH MELK 1.89",
        lines: [
          {
            text: "AH MELK 1.89",
            frame: { left: 10, top: 100, width: 300, height: 20 },
            elements: [
              {
                text: "AH",
                frame: { left: 10, top: 100, width: 30, height: 20 },
              },
              {
                text: "MELK",
                frame: { left: 50, top: 100, width: 80, height: 20 },
              },
              {
                text: "1.89",
                frame: { left: 250, top: 100, width: 50, height: 20 },
              },
            ],
          },
        ],
      },
    ]);

    expect(text).toContain("AH MELK 1.89");
  });
});

describe("scoreOcrText", () => {
  it("prefers richer OCR candidates", () => {
    const sparse = "SHOP";
    const rich = "JUMBO\nBread 2.50\nTOTAL 35.00\nRegels: 12";
    expect(scoreOcrText(rich)).toBeGreaterThan(scoreOcrText(sparse));
    expect(pickBestOcrText([sparse, rich])).toBe(rich);
  });
});
