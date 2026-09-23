export type ReceiptTextFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ReceiptTextElement = {
  text: string;
  frame?: ReceiptTextFrame;
};

export type ReceiptTextLine = {
  text: string;
  frame?: ReceiptTextFrame;
  elements?: ReceiptTextElement[];
};

export type ReceiptTextBlock = {
  text: string;
  frame?: ReceiptTextFrame;
  lines: ReceiptTextLine[];
};

const MONEY_TOKEN = /\d+[.,]\d{2}/;

function frameLeft(frame?: ReceiptTextFrame): number {
  return frame?.left ?? 0;
}

function frameTop(frame?: ReceiptTextFrame): number {
  return frame?.top ?? 0;
}

function reconstructLineFromElements(elements: ReceiptTextElement[]): string {
  if (elements.length === 0) return "";

  const sorted = [...elements].sort(
    (a, b) => frameLeft(a.frame) - frameLeft(b.frame)
  );

  const moneyStart = sorted.findIndex((element) =>
    MONEY_TOKEN.test(element.text.trim())
  );

  if (moneyStart > 0) {
    const label = sorted
      .slice(0, moneyStart)
      .map((element) => element.text.trim())
      .filter(Boolean)
      .join(" ");
    const amounts = sorted
      .slice(moneyStart)
      .map((element) => element.text.trim())
      .filter(Boolean)
      .join(" ");
    return `${label} ${amounts}`.trim();
  }

  return sorted
    .map((element) => element.text.trim())
    .filter(Boolean)
    .join(" ");
}

function mergeColumnAwareLines(lines: ReceiptTextLine[]): string[] {
  const output: string[] = [];

  for (const line of lines) {
    const elements = line.elements ?? [];
    if (elements.length >= 2) {
      const reconstructed = reconstructLineFromElements(elements);
      if (reconstructed) {
        output.push(reconstructed);
        continue;
      }
    }

    const trimmed = line.text.trim();
    if (trimmed) output.push(trimmed);
  }

  return output;
}

/** Reconstruct reading-order text using ML Kit line/element bounding boxes. */
export function reconstructReceiptTextFromBlocks(
  blocks: ReceiptTextBlock[]
): string {
  const positionedLines: Array<{
    top: number;
    left: number;
    line: ReceiptTextLine;
  }> = [];

  for (const block of blocks) {
    for (const line of block.lines) {
      positionedLines.push({
        top: frameTop(line.frame) || frameTop(block.frame),
        left: frameLeft(line.frame) || frameLeft(block.frame),
        line,
      });
    }
  }

  positionedLines.sort((a, b) => {
    const yDiff = a.top - b.top;
    if (Math.abs(yDiff) > 10) return yDiff;
    return a.left - b.left;
  });

  return mergeColumnAwareLines(positionedLines.map((entry) => entry.line)).join(
    "\n"
  );
}
